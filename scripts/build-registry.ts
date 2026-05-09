import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import packageJson from "../package.json" with { type: "json" };
import type { MCPContext } from "../src/context/mcp-context.js";
import { initI18n } from "../src/i18n/index.js";
import { setupPrompts } from "../src/prompts/index.js";
import { setupResources } from "../src/resources/index.js";
import { setupTools } from "../src/tools/index.js";

type RegistryResource = { name: string; uriTemplate: string };
type Registry = {
  version: string;
  tools: string[];
  resources: RegistryResource[];
  prompts: string[];
};

const tools: string[] = [];
const resources: RegistryResource[] = [];
const prompts: string[] = [];

const server = new McpServer({ name: "introspect", version: "0.0.0" });

type RegisterTool = typeof server.registerTool;
type RegisterResource = typeof server.registerResource;
type RegisterPrompt = typeof server.registerPrompt;

const originalRegisterTool = server.registerTool.bind(server) as RegisterTool;
server.registerTool = ((...args: Parameters<RegisterTool>) => {
  tools.push(args[0]);
  return originalRegisterTool(...args);
}) as RegisterTool;

const originalRegisterResource = server.registerResource.bind(
  server,
) as RegisterResource;
server.registerResource = ((...args: Parameters<RegisterResource>) => {
  const [name, uriOrTemplate] = args;
  const uriTemplate =
    uriOrTemplate instanceof ResourceTemplate
      ? uriOrTemplate.uriTemplate.toString()
      : uriOrTemplate;
  resources.push({ name, uriTemplate });
  return originalRegisterResource(...args);
}) as RegisterResource;

const originalRegisterPrompt = server.registerPrompt.bind(
  server,
) as RegisterPrompt;
server.registerPrompt = ((...args: Parameters<RegisterPrompt>) => {
  prompts.push(args[0]);
  return originalRegisterPrompt(...args);
}) as RegisterPrompt;

await initI18n();

const stubContext: MCPContext = {};
setupTools(server, stubContext);
setupResources(server, stubContext);
setupPrompts(server, stubContext);

const registry: Registry = {
  version: packageJson.version,
  tools,
  resources,
  prompts,
};

const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "registry.json",
);
writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
console.error(`Wrote ${outputPath}`);
console.error(
  `  ${tools.length} tools, ${resources.length} resources, ${prompts.length} prompts`,
);
