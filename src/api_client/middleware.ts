import type { Middleware } from "openapi-fetch";
import type { Logger } from "../logger/index.js";

export function createAuthMiddleware(
  apiAccessToken: string,
  logger: Logger,
): Middleware {
  return {
    async onRequest({ request }) {
      request.headers.set("Authorization", `Bearer ${apiAccessToken}`);
      return request;
    },
    async onResponse({ response }) {
      const rateLimit = response.headers.get("x-ratelimit-limit");
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimit && remaining) {
        logger.log(`Rate limit: ${remaining}/${rateLimit}`);
      }
      // return undefined to avoid openapi-fetch instanceof Response check issue
      // https://github.com/openapi-ts/openapi-typescript/issues/1847
    },
    async onError({ error }) {
      logger.error("Network Error:", error);
    },
  };
}
