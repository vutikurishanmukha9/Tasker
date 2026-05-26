import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, AuthenticationError, fetchAllPages } from "../lib/api";

global.fetch = vi.fn();

const jsonResponse = (body: unknown, ok = true, status = ok ? 200 : 400) => ({
  ok,
  status,
  json: async () => body,
}) as Response;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("apiFetch utility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.cookie = "csrftoken=; Max-Age=0";
  });

  it("uses cookie credentials and does not send an Authorization header", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: "success" }),
    );

    await apiFetch("/test-endpoint");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/test-endpoint"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      }),
    );
  });

  it("adds X-CSRFToken for unsafe methods when the csrf cookie is readable", async () => {
    document.cookie = "csrftoken=csrf-value";
    vi.mocked(global.fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: "success" }),
    );

    await apiFetch("/test-endpoint", { method: "POST", data: { ok: true } });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/test-endpoint"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-CSRFToken": "csrf-value",
        }),
      }),
    );
  });

  it("queues concurrent 401s behind a single refresh and retries each once", async () => {
    let originalCalls = 0;
    let refreshCalls = 0;

    vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/auth/token/refresh/")) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse({ success: true }));
      }

      originalCalls += 1;
      if (originalCalls <= 5) {
        return Promise.resolve(jsonResponse({ success: false }, false, 401));
      }

      return Promise.resolve(jsonResponse({ success: true, data: "ok" }));
    });

    await Promise.all([
      apiFetch("/one"),
      apiFetch("/two"),
      apiFetch("/three"),
      apiFetch("/four"),
      apiFetch("/five"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(originalCalls).toBe(10);
  });

  it("waits for an in-flight refresh before starting a new authenticated request", async () => {
    const refresh = deferred<Response>();
    let call = 0;

    vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
      const requestUrl = String(url);
      call += 1;
      if (requestUrl.includes("/auth/token/refresh/")) {
        return refresh.promise;
      }
      if (call === 1) {
        return Promise.resolve(jsonResponse({ success: false }, false, 401));
      }
      return Promise.resolve(jsonResponse({ success: true, data: "ok" }));
    });

    const first = apiFetch("/first");
    await Promise.resolve();
    await Promise.resolve();

    const second = apiFetch("/second");
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(2);

    refresh.resolve(jsonResponse({ success: true }));
    await Promise.all([first, second]);

    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("throws AuthenticationError when refresh fails without redirecting", async () => {
    const hrefBefore = window.location.href;
    vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/auth/token/refresh/")) {
        return Promise.resolve(jsonResponse({ success: false }, false, 401));
      }
      return Promise.resolve(jsonResponse({ success: false }, false, 401));
    });

    await expect(apiFetch("/protected")).rejects.toBeInstanceOf(AuthenticationError);
    expect(window.location.href).toBe(hrefBefore);
  });

  it("fetches paginated results without dropping later pages", async () => {
    vi.mocked(global.fetch).mockImplementation((url: string | URL | Request) => {
      const requestUrl = String(url);
      if (requestUrl.includes("page=2")) {
        return Promise.resolve(jsonResponse({
          data: {
            results: [{ id: 2 }],
            pagination: { count: 3, page_size: 1, current_page: 2, total_pages: 3, next: "page=3", previous: null },
          },
        }));
      }
      if (requestUrl.includes("page=3")) {
        return Promise.resolve(jsonResponse({
          data: {
            results: [{ id: 3 }],
            pagination: { count: 3, page_size: 1, current_page: 3, total_pages: 3, next: null, previous: null },
          },
        }));
      }
      return Promise.resolve(jsonResponse({
        data: {
          results: [{ id: 1 }],
          pagination: { count: 3, page_size: 1, current_page: 1, total_pages: 3, next: "page=2", previous: null },
        },
      }));
    });

    await expect(fetchAllPages<{ id: number }>("/tasks/")).resolves.toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
