import type { Middleware } from "openapi-fetch";

export function createAuthMiddleware(apiAccessToken: string): Middleware {
  return {
    async onRequest({ request }) {
      request.headers.set("Authorization", `Bearer ${apiAccessToken}`);
      return request;
    },
    async onResponse({ response }) {
      const rateLimit = response.headers.get("x-ratelimit-limit");
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimit && remaining) {
        console.error(`Rate limit: ${remaining}/${rateLimit}`);
      }
      return response;
    },
    async onError({ error }) {
      console.error("Network Error:", error);
    },
  };
}
