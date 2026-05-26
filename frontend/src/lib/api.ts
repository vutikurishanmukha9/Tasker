import { ApiResponse, PaginatedResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

type JsonObject = Record<string, unknown>;

interface FetchOptions extends RequestInit {
  data?: JsonObject | unknown[];
  skipAuth?: boolean;
  retryOnAuthFailure?: boolean;
}

type AuthFailureListener = () => void;

const authFailureListeners = new Set<AuthFailureListener>();
let refreshPromise: Promise<void> | null = null;

export class AuthenticationError extends Error {
  constructor(message = "Session expired. Please log in again.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function onAuthenticationFailed(listener: AuthFailureListener) {
  authFailureListeners.add(listener);
  return () => authFailureListeners.delete(listener);
}

export function notifyAuthenticationFailed() {
  authFailureListeners.forEach((listener) => listener());
}

function getCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function isUnsafeMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
}

function getObjectValue(value: unknown, key: string) {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }
  return (value as Record<string, unknown>)[key];
}

function normalizeErrorMessage(result: unknown): string {
  const message = getObjectValue(result, "message");
  if (message) return String(message);
  const errors = getObjectValue(result, "errors");

  if (!errors) return "An error occurred";
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.map(String).join(", ");
  if (typeof errors === "object") {
    const firstValue = Object.values(errors)[0];
    if (Array.isArray(firstValue)) return firstValue.map(String).join(", ");
    if (typeof firstValue === "object" && firstValue !== null) {
      return normalizeErrorMessage({ errors: firstValue });
    }
    if (firstValue !== undefined) return String(firstValue);
  }

  return "An error occurred";
}

function buildConfig(options: FetchOptions): RequestInit {
  const { data, skipAuth: _skipAuth, retryOnAuthFailure: _retry, ...customConfig } = options;
  const method = (customConfig.method || (data ? "POST" : "GET")).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customConfig.headers as Record<string, string> | undefined),
  };

  const csrfToken = getCookie("csrftoken");
  if (csrfToken && isUnsafeMethod(method)) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return {
    method,
    ...customConfig,
    credentials: customConfig.credentials ?? "include",
    headers,
    body: data ? JSON.stringify(data) : customConfig.body,
  };
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/token/refresh/`, buildConfig({
      method: "POST",
      skipAuth: true,
      retryOnAuthFailure: false,
    })).then(async (response) => {
      if (!response.ok) {
        throw new AuthenticationError();
      }
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { skipAuth = false, retryOnAuthFailure = true } = options;

  if (!skipAuth && refreshPromise) {
    await refreshPromise;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, buildConfig(options));

  if (response.status === 401 && !skipAuth && retryOnAuthFailure) {
    try {
      await refreshSession();
    } catch {
      throw new AuthenticationError();
    }

    response = await fetch(
      `${API_BASE}${endpoint}`,
      buildConfig({ ...options, retryOnAuthFailure: false }),
    );

    if (response.status === 401) {
      throw new AuthenticationError();
    }
  }

  const result = await parseJson(response);

  if (!response.ok) {
    throw new Error(normalizeErrorMessage(result));
  }

  return result as ApiResponse<T>;
}

export async function fetchAllPages<T>(endpoint: string) {
  const firstPage = await apiFetch<PaginatedResponse<T>["data"]>(endpoint);
  const { results, pagination } = firstPage.data;

  if (pagination.total_pages <= 1) {
    return results;
  }

  const separator = endpoint.includes("?") ? "&" : "?";
  const requests = [];
  for (let page = 2; page <= pagination.total_pages; page += 1) {
    requests.push(apiFetch<PaginatedResponse<T>["data"]>(`${endpoint}${separator}page=${page}`));
  }

  const pages = await Promise.all(requests);
  return [
    ...results,
    ...pages.flatMap((page) => page.data.results),
  ];
}
