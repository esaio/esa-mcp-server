import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthMiddleware } from "../middleware.js";

describe("createAuthMiddleware", () => {
  // Mock console.error to verify rate limit and error logging without console output
  let consoleErrorSpy: MockInstance<typeof console.error>;

  // Create test request for authorization header testing
  const createTestRequest = (url = "https://api.esa.example.com/test") =>
    new Request(url);

  // Create test response with optional rate limit headers
  const createTestResponse = (rateLimitHeaders?: {
    limit?: string;
    remaining?: string;
  }) => {
    const headers: Record<string, string> = {};
    if (rateLimitHeaders?.limit) {
      headers["x-ratelimit-limit"] = rateLimitHeaders.limit;
    }
    if (rateLimitHeaders?.remaining) {
      headers["x-ratelimit-remaining"] = rateLimitHeaders.remaining;
    }
    return new Response(null, { headers });
  };

  // Helper to call middleware methods with minimal required context using as unknown as pattern
  const callOnRequest = (
    middleware: ReturnType<typeof createAuthMiddleware>,
    request: Request,
  ) =>
    middleware.onRequest?.({
      request,
      schemaPath: "/test",
      params: {},
      id: "test-id",
      options: { baseUrl: "https://api.esa.example.com" },
    } as unknown as Parameters<NonNullable<typeof middleware.onRequest>>[0]);

  const callOnResponse = (
    middleware: ReturnType<typeof createAuthMiddleware>,
    response: Response,
  ) =>
    middleware.onResponse?.({
      request: createTestRequest(),
      response,
      schemaPath: "/test",
      params: {},
      id: "test-id",
      options: { baseUrl: "https://api.esa.example.com" },
    } as unknown as Parameters<NonNullable<typeof middleware.onResponse>>[0]);

  const callOnError = (
    middleware: ReturnType<typeof createAuthMiddleware>,
    error: Error,
  ) =>
    middleware.onError?.({
      request: createTestRequest(),
      error,
      schemaPath: "/test",
      params: {},
      id: "test-id",
      options: { baseUrl: "https://api.esa.example.com" },
    } as unknown as Parameters<NonNullable<typeof middleware.onError>>[0]);

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should add authorization header", async () => {
    const middleware = createAuthMiddleware("test-token");
    const request = createTestRequest();

    expect(middleware.onRequest).toBeDefined();
    expect(request.headers.get("Authorization")).toBeNull();

    await callOnRequest(middleware, request);

    expect(request.headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("should log rate limit info when present", async () => {
    const middleware = createAuthMiddleware("test-token");
    const response = createTestResponse({ limit: "75", remaining: "50" });

    await callOnResponse(middleware, response);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Rate limit: 50/75");
  });

  it("should handle response without rate limit headers", async () => {
    const middleware = createAuthMiddleware("test-token");
    const response = createTestResponse();

    await callOnResponse(middleware, response);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("should log network errors", async () => {
    const middleware = createAuthMiddleware("test-token");
    const error = new Error("Network failed");

    await callOnError(middleware, error);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Network Error:", error);
  });

  it("should return the modified request", async () => {
    const middleware = createAuthMiddleware("test-token");
    const request = createTestRequest();

    const result = await callOnRequest(middleware, request);

    expect(result).toBe(request);
    expect(request.headers.get("Authorization")).toBe("Bearer test-token");
  });
});
