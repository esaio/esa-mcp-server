import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import { setupTools } from "../index.js";

const noop = () => {};
const noopLogger = {
  log: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

describe("setupTools", () => {
  let server: McpServer;
  let context: MCPContext;

  beforeEach(() => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });
    context = { logger: noopLogger };

    vi.clearAllMocks();
  });

  it("should register all 25 tools with correct handlers", () => {
    const registerToolSpy = vi.spyOn(server, "registerTool");

    setupTools(server, context);

    expect(registerToolSpy).toHaveBeenCalledTimes(26);

    for (let i = 0; i < 26; i++) {
      const call = registerToolSpy.mock.calls[i] as unknown as [
        string,
        object,
        // biome-ignore lint/complexity/noBannedTypes: Function type needed for mock verification
        Function,
      ];
      const [toolName, schema, handler] = call;
      expect(typeof toolName).toBe("string");
      expect(toolName).toMatch(/^esa_/); // All tools should start with 'esa_'
      expect(schema).toBeTypeOf("object"); // Schema verification handled by individual tool tests
      expect(handler).toBeTypeOf("function"); // Handler functionality tested in specific tool tests
    }
  });
});
