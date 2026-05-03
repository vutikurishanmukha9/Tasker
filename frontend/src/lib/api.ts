import { ApiResponse } from "./types";

// Prefer Vite's import.meta.env, fallback to localhost for local dev
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Helper to get tokens
export const getTokens = () => {
  const tokens = localStorage.getItem("ttm.tokens");
  if (!tokens) return null;
  try {
    return JSON.parse(tokens) as { access: string; refresh: string };
  } catch {
    return null;
  }
};

export const setTokens = (tokens: { access: string; refresh: string } | null) => {
  if (tokens) {
    localStorage.setItem("ttm.tokens", JSON.stringify(tokens));
  } else {
    localStorage.removeItem("ttm.tokens");
  }
};

interface FetchOptions extends RequestInit {
  data?: any;
  skipAuth?: boolean;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const { data, skipAuth, ...customConfig } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!skipAuth) {
    const tokens = getTokens();
    if (tokens?.access) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
    }
  }

  const config: RequestInit = {
    method: data ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle token refresh
  if (response.status === 401 && !skipAuth) {
    const tokens = getTokens();
    if (tokens?.refresh) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setTokens({ access: refreshData.access, refresh: tokens.refresh });
          
          // Retry original request
          headers["Authorization"] = `Bearer ${refreshData.access}`;
          config.headers = headers;
          response = await fetch(`${API_BASE}${endpoint}`, config);
        } else {
          // Refresh failed, logout
          setTokens(null);
          window.location.href = "/login";
          throw new Error("Session expired. Please log in again.");
        }
      } catch (err) {
        setTokens(null);
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      setTokens(null);
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  let result;
  try {
    result = await response.json();
  } catch (err) {
    throw new Error("Invalid JSON response from server");
  }

  if (!response.ok) {
    // Attempt to extract the best error message from our standard envelope or standard DRF errors
    let errorMsg = result?.message || "An error occurred";
    
    if (result?.errors) {
      if (typeof result.errors === 'string') {
        errorMsg = result.errors;
      } else if (Array.isArray(result.errors) && result.errors.length > 0) {
         errorMsg = result.errors[0];
      } else if (typeof result.errors === 'object') {
        // Grab the first value from the object
        const firstKey = Object.keys(result.errors)[0];
        if (firstKey) {
           const val = result.errors[firstKey];
           errorMsg = Array.isArray(val) ? val[0] : val;
        }
      }
    }
    
    throw new Error(errorMsg);
  }

  return result as ApiResponse<T>;
}
