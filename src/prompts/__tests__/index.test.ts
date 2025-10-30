import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import { setupPrompts } from "../index.js";

describe("setupPrompts", () => {
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

  it("should register all prompts with correct handlers", () => {
    const registerPromptSpy = vi.spyOn(server, "registerPrompt");

    setupPrompts(server, context);

    expect(registerPromptSpy).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 1; i++) {
      const [promptName, schema, handler] = registerPromptSpy.mock.calls[i];
      expect(typeof promptName).toBe("string");
      expect(promptName).toMatch(/^esa_/); // All prompts should start with 'esa_'
      expect(schema).toBeTypeOf("object"); // Schema verification handled by individual prompt tests
      expect(handler).toBeTypeOf("function"); // Handler functionality tested in specific prompt tests
    }
  });

  it("should log setup completion message", () => {
    setupPrompts(server, context);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Setting up MCP prompts...");
  });
});
