import packageJson from "../../package.json" with { type: "json" };
import type { StdioContext } from "../context/stdio-context.js";

export const config = {
  esa: {
    apiAccessToken: process.env.ESA_ACCESS_TOKEN || "",
    apiBaseUrl: process.env.ESA_API_BASE_URL || "https://api.esa.io",
  } satisfies StdioContext,
  server: {
    name: "esa-mcp-server",
    version: packageJson.version,
    description: "Official MCP server for esa.io",
  },
} as const;

export function validateConfig(): void {
  if (!config.esa.apiAccessToken) {
    throw new Error("ESA_ACCESS_TOKEN environment variable is required");
  }
}
