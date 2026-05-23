import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import type { Logger } from "../../logger/index.js";
import { setupPrompts } from "../index.js";

describe("setupPrompts", () => {
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

    expect(loggerSpy.log).toHaveBeenCalledWith("Setting up MCP prompts...");
  });
});
