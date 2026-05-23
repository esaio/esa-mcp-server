#!/usr/bin/env node
import { Console } from "node:console";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config, validateConfig } from "./config/index.js";
import type { StdioContext } from "./context/stdio-context.js";
import { initI18n } from "./i18n/index.js";
import { setupPrompts } from "./prompts/index.js";
import { setupResources } from "./resources/index.js";
import { setupTools } from "./tools/index.js";

// STDIO transport では stdout が JSON-RPC 専用のため、全レベルを stderr に流す
const logger = new Console({
  stdout: process.stderr,
  stderr: process.stderr,
});

try {
  validateConfig();
} catch (error) {
  logger.error("Configuration error:", error);
  process.exit(1);
}

async function main() {
  await initI18n();

  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  const context: StdioContext = { ...config.esa, logger };

  setupTools(server, context);
  setupResources(server, context);
  setupPrompts(server, context);

  const transport = new StdioServerTransport();

  // Handle transport errors gracefully
  transport.onclose = () => {
    logger.log("Transport closed");
  };

  transport.onerror = (error) => {
    logger.error("Transport error:", error);
  };

  await server.connect(transport);
  logger.log(`${config.server.name} v${config.server.version} started`);
}

await main().catch((error) => {
  logger.error("Server startup error:", error);
  process.exit(1);
});
