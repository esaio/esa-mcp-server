import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import { setupTools } from "../index.js";

describe("setupTools", () => {
  let server: McpServer;
  let context: MCPContext;
  let consoleErrorSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    server = new McpServer({
      name: "test-server",
      version: "1.0.0",
    });
    context = {} as unknown as MCPContext;

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should register all 24 tools with correct handlers", () => {
    const registerToolSpy = vi.spyOn(server, "registerTool");

    setupTools(server, context);

    expect(registerToolSpy).toHaveBeenCalledTimes(24);

    for (let i = 0; i < 24; i++) {
      const [toolName, schema, handler] = registerToolSpy.mock.calls[i];
      expect(typeof toolName).toBe("string");
      expect(toolName).toMatch(/^esa_/); // All tools should start with 'esa_'
      expect(schema).toBeTypeOf("object"); // Schema verification handled by individual tool tests
      expect(handler).toBeTypeOf("function"); // Handler functionality tested in specific tool tests
    }
  });

  it("should log setup completion message", () => {
    setupTools(server, context);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Setting up MCP tools...");
  });
});
