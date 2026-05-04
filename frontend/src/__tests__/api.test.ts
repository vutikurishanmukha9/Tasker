import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "../lib/api";

// Mock the global fetch API
global.fetch = vi.fn();

describe("apiFetch utility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("adds the Authorization header when a token is present in localStorage", async () => {
    // Setup mock token and fetch response
    localStorage.setItem("access_token", "mock-jwt-token");
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "success" }),
    });

    await apiFetch("/test-endpoint");

    // Verify fetch was called with the correct headers
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/test-endpoint"),
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock-jwt-token",
        },
      })
    );
  });

  it("does not add Authorization header if no token is present", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "success" }),
    });

    await apiFetch("/test-endpoint");

    // Verify fetch was called without Authorization header
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/test-endpoint"),
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  });
});
