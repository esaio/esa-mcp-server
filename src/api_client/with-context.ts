import { createEsaClient } from "../api_client/index.js";
import type { MCPContext } from "../context/mcp-context.js";

export async function withContext<T extends unknown[], R>(
  context: MCPContext,
  handler: (
    client: ReturnType<typeof createEsaClient>,
    ...args: T
  ) => Promise<R>,
  ...args: T
): Promise<R> {
  let client: ReturnType<typeof createEsaClient>;

  if ("apiAccessToken" in context && "apiBaseUrl" in context) {
    client = createEsaClient(
      context.apiAccessToken as string,
      context.apiBaseUrl as string,
    );
  } else {
    throw new Error(
      "Unsupported context type. Only StdioContext is currently supported.",
    );
  }

  return handler(client, ...args);
}
