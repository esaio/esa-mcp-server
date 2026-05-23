import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "../../logger/index.js";
import { createAuthMiddleware } from "../middleware.js";

type SpyLogger = { [K in keyof Logger]: ReturnType<typeof vi.fn> };

describe("createAuthMiddleware", () => {
  // Spy on each Logger method to assert injected-logger behavior
  let loggerSpy: SpyLogger;
  let logger: Logger;

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
    loggerSpy = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    logger = loggerSpy as unknown as Logger;
  });

  it("should add authorization header", async () => {
    const middleware = createAuthMiddleware("test-token", logger);
    const request = createTestRequest();

    expect(middleware.onRequest).toBeDefined();
    expect(request.headers.get("Authorization")).toBeNull();

    await callOnRequest(middleware, request);

    expect(request.headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("should log rate limit info when present", async () => {
    const middleware = createAuthMiddleware("test-token", logger);
    const response = createTestResponse({ limit: "75", remaining: "50" });

    await callOnResponse(middleware, response);
    expect(loggerSpy.log).toHaveBeenCalledWith("Rate limit: 50/75");
  });

  it("should handle response without rate limit headers", async () => {
    const middleware = createAuthMiddleware("test-token", logger);
    const response = createTestResponse();

    await callOnResponse(middleware, response);
    expect(loggerSpy.log).not.toHaveBeenCalled();
  });

  it("should log network errors", async () => {
    const middleware = createAuthMiddleware("test-token", logger);
    const error = new Error("Network failed");

    await callOnError(middleware, error);
    expect(loggerSpy.error).toHaveBeenCalledWith("Network Error:", error);
  });

  it("should return the modified request", async () => {
    const middleware = createAuthMiddleware("test-token", logger);
    const request = createTestRequest();

    const result = await callOnRequest(middleware, request);

    expect(result).toBe(request);
    expect(request.headers.get("Authorization")).toBe("Bearer test-token");
  });
});
