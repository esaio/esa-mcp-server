import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MCPContext } from "../src/context/mcp-context.js";
import { initI18n } from "../src/i18n/index.js";
import { setupPrompts } from "../src/prompts/index.js";
import { setupResources } from "../src/resources/index.js";
import { setupTools } from "../src/tools/index.js";

type NamedRegistryEntry = { name: string };
type RegistryResource = { name: string; uriTemplate: string };
type Registry = {
  tools: NamedRegistryEntry[];
  resources: RegistryResource[];
  prompts: NamedRegistryEntry[];
};

const tools: NamedRegistryEntry[] = [];
const resources: RegistryResource[] = [];
const prompts: NamedRegistryEntry[] = [];

// register{Tool,Resource,Prompt} はオーバーロード + ジェネリックで Parameters<typeof X>
// が安定しないため、name (と resource の場合は uriOrTemplate) だけを受け取るスタブに
// 差し替える。McpServer は名前収集のための足場としてしか使わないので、登録の副作用は
// 不要で戻り値も捨ててよい。
const server = new McpServer({ name: "introspect", version: "0.0.0" });

server.registerTool = ((name: string) => {
  tools.push({ name });
}) as unknown as typeof server.registerTool;

server.registerResource = ((
  name: string,
  uriOrTemplate: string | ResourceTemplate,
) => {
  const uriTemplate =
    uriOrTemplate instanceof ResourceTemplate
      ? uriOrTemplate.uriTemplate.toString()
      : uriOrTemplate;
  resources.push({ name, uriTemplate });
}) as unknown as typeof server.registerResource;

server.registerPrompt = ((name: string) => {
  prompts.push({ name });
}) as unknown as typeof server.registerPrompt;

await initI18n();

const noop = () => {};
const stubContext: MCPContext = {
  logger: { log: noop, debug: noop, info: noop, warn: noop, error: noop },
};
setupTools(server, stubContext);
setupResources(server, stubContext);
setupPrompts(server, stubContext);

const registry: Registry = {
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
