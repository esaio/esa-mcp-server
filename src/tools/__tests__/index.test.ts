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

  it("should register all 28 tools with correct handlers", () => {
    const registerToolSpy = vi.spyOn(server, "registerTool");

    setupTools(server, context);

    expect(registerToolSpy).toHaveBeenCalledTimes(28);

    for (let i = 0; i < 28; i++) {
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

  // 省略した hint は MCP 仕様の既定値 (destructiveHint / openWorldHint は true) で解釈される
  it("should set readOnlyHint, destructiveHint and openWorldHint explicitly on every tool", () => {
    const registerToolSpy = vi.spyOn(server, "registerTool");

    setupTools(server, context);

    for (const call of registerToolSpy.mock.calls) {
      const [toolName, config] = call as unknown as [
        string,
        { annotations?: Record<string, unknown> },
      ];
      const annotations = config.annotations ?? {};
      for (const hint of ["readOnlyHint", "destructiveHint", "openWorldHint"]) {
        expect(
          typeof annotations[hint],
          `${toolName}.annotations.${hint}`,
        ).toBe("boolean");
      }
      if (annotations.readOnlyHint) {
        expect(annotations.destructiveHint, toolName).toBe(false);
      }
    }
  });
});
