import createClient from "openapi-fetch";
import packageJson from "../../package.json" with { type: "json" };
import type { paths } from "../generated/api-types.js";
import type { Logger } from "../logger/index.js";
import { createAuthMiddleware } from "./middleware.js";

const packageVersion = packageJson.version;

function createUserAgentMiddleware(version: string) {
  return {
    async onRequest({ request }: { request: Request }) {
      request.headers.set("User-Agent", `esa-mcp-server/${version} (official)`);
      return request;
    },
  };
}

export function createEsaClient(
  apiAccessToken: string,
  apiBaseUrl: string = "https://api.esa.io",
  logger: Logger,
) {
  const client = createClient<paths>({
    baseUrl: apiBaseUrl,
  });

  client.use(createUserAgentMiddleware(packageVersion));
  client.use(createAuthMiddleware(apiAccessToken, logger));

  return client;
}
