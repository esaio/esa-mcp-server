import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import type { Logger } from "../../logger/index.js";
import { setupResources } from "../index.js";

describe("setupResources", () => {
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

  it("should register all resources with correct handlers", () => {
    const registerResourceSpy = vi.spyOn(server, "registerResource");

    setupResources(server, context);

    expect(registerResourceSpy).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 1; i++) {
      const [resourceName, template, metadata, handler] =
        registerResourceSpy.mock.calls[i];
      expect(typeof resourceName).toBe("string");
      expect(resourceName).toMatch(/^esa_/); // All resources should start with 'esa_'
      expect(template).toBeTypeOf("object"); // Template verification handled by specific resource tests
      expect(metadata).toBeTypeOf("object"); // Metadata verification handled by specific resource tests
      expect(handler).toBeTypeOf("function"); // Handler functionality tested in specific resource tests
    }
  });

  it("should log setup completion message", () => {
    setupResources(server, context);

    expect(loggerSpy.log).toHaveBeenCalledWith("Setting up MCP resources...");
  });
});
