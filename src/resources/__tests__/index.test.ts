import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPContext } from "../../context/mcp-context.js";
import { setupResources } from "../index.js";

describe("setupResources", () => {
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

    expect(consoleErrorSpy).toHaveBeenCalledWith("Setting up MCP resources...");
  });
});
