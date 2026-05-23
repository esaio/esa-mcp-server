import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import type { Logger } from "../../logger/index.js";
import { setupTools } from "../index.js";

describe("setupTools", () => {
  let server: McpServer;
  let context: MCPContext;
  let loggerSpy: { [K in keyof Logger]: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });
    loggerSpy = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    context = { logger: loggerSpy as unknown as Logger };

    vi.clearAllMocks();
  });

  it("should register all 25 tools with correct handlers", () => {
    const registerToolSpy = vi.spyOn(server, "registerTool");

    setupTools(server, context);

    expect(registerToolSpy).toHaveBeenCalledTimes(25);

    for (let i = 0; i < 25; i++) {
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

  it("should log setup completion message", () => {
    setupTools(server, context);

    expect(loggerSpy.log).toHaveBeenCalledWith("Setting up MCP tools...");
  });
});
