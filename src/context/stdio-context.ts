import type { MCPContext } from "./mcp-context.js";

export interface StdioContext extends MCPContext {
  apiAccessToken: string;
  apiBaseUrl: string;
}
