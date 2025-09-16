#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config, validateConfig } from "./config/index.js";
import { initI18n } from "./i18n/index.js";
import { setupPrompts } from "./prompts/index.js";
import { setupResources } from "./resources/index.js";
import { setupTools } from "./tools/index.js";

try {
  validateConfig();
} catch (error) {
  console.error("Configuration error:", error);
  process.exit(1);
}

async function main() {
  await initI18n();

  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  setupTools(server, config.esa);
  setupResources(server, config.esa);
  setupPrompts(server, config.esa);

  const transport = new StdioServerTransport();

  // Handle transport errors gracefully
  transport.onclose = () => {
    console.error("Transport closed");
  };

  transport.onerror = (error) => {
    console.error("Transport error:", error);
  };

  await server.connect(transport);
  console.error(`${config.server.name} v${config.server.version} started`);
}

await main().catch((error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});
