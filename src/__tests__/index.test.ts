import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("MCP Server", () => {
  let consoleErrorSpy: MockInstance<typeof console.error>;
  let processExitSpy: MockInstance<typeof process.exit>;

  const createMockConfig = (behavior?: { shouldThrow?: boolean }) => ({
    config: {
      server: {
        name: "test-server",
        version: "1.0.0",
      },
      esa: {
        apiAccessToken: "test-token",
        apiBaseUrl: "https://api.esa.example.com",
      },
    },
    validateConfig: vi.fn().mockImplementation(() => {
      if (behavior?.shouldThrow) {
        throw new Error("Invalid config");
      }
    }),
  });

  const createMockServer = (behavior?: { shouldFailConnect?: boolean }) => {
    const mockConnect = behavior?.shouldFailConnect
      ? vi.fn().mockRejectedValue(new Error("Connection failed"))
      : vi.fn().mockResolvedValue(undefined);

    return {
      connect: mockConnect,
    } as unknown as McpServer;
  };

  const createMockTransport = () =>
    ({
      onclose: undefined as (() => void) | undefined,
      onerror: undefined as ((error: Error) => void) | undefined,
    }) as unknown as StdioServerTransport;

  const setupServerMocks = (
    mockConfig: ReturnType<typeof createMockConfig>,
    mockServer: ReturnType<typeof createMockServer>,
    mockTransport: ReturnType<typeof createMockTransport>,
    setupFunctions?: {
      setupTools?: ReturnType<typeof vi.fn>;
      setupResources?: ReturnType<typeof vi.fn>;
      setupPrompts?: ReturnType<typeof vi.fn>;
      initI18n?: ReturnType<typeof vi.fn>;
    },
  ) => {
    const MockMcpServer = vi.fn().mockReturnValue(mockServer);
    const MockStdioServerTransport = vi.fn().mockReturnValue(mockTransport);

    vi.doMock("../config/index.js", () => mockConfig);
    vi.doMock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
      McpServer: MockMcpServer,
    }));
    vi.doMock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
      StdioServerTransport: MockStdioServerTransport,
    }));
    vi.doMock("../tools/index.js", () => ({
      setupTools: setupFunctions?.setupTools ?? vi.fn(),
    }));
    vi.doMock("../resources/index.js", () => ({
      setupResources: setupFunctions?.setupResources ?? vi.fn(),
    }));
    vi.doMock("../prompts/index.js", () => ({
      setupPrompts: setupFunctions?.setupPrompts ?? vi.fn(),
    }));
    vi.doMock("../i18n/index.js", () => ({
      initI18n:
        setupFunctions?.initI18n ?? vi.fn().mockResolvedValue(undefined),
    }));

    return { MockMcpServer, MockStdioServerTransport };
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.resetModules();
  });

  it("should validate config on startup", async () => {
    const mockConfig = createMockConfig();
    const mockServer = createMockServer();
    const mockTransport = createMockTransport();

    setupServerMocks(mockConfig, mockServer, mockTransport);

    await import("../index.js");

    expect(mockConfig.validateConfig).toHaveBeenCalled();
  });

  it("should exit with error when config validation fails", async () => {
    const mockConfig = createMockConfig({ shouldThrow: true });

    vi.doMock("../config/index.js", () => mockConfig);

    try {
      await import("../index.js");
    } catch (_error) {
      // Expected to throw due to config validation
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Configuration error:",
      expect.any(Error),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should create MCP server and connect", async () => {
    const mockConfig = createMockConfig();
    const mockServer = createMockServer();
    const mockTransport = createMockTransport();

    // Track setup function calls
    const mockSetupTools = vi.fn();
    const mockSetupResources = vi.fn();
    const mockSetupPrompts = vi.fn();

    const { MockMcpServer } = setupServerMocks(
      mockConfig,
      mockServer,
      mockTransport,
      {
        setupTools: mockSetupTools,
        setupResources: mockSetupResources,
        setupPrompts: mockSetupPrompts,
      },
    );

    await import("../index.js");

    expect(MockMcpServer).toHaveBeenCalledWith({
      name: "test-server",
      version: "1.0.0",
    });

    const expectedEsaConfig = {
      apiAccessToken: "test-token",
      apiBaseUrl: "https://api.esa.example.com",
    };

    expect(mockSetupTools).toHaveBeenCalledWith(mockServer, expectedEsaConfig);
    expect(mockSetupResources).toHaveBeenCalledWith(
      mockServer,
      expectedEsaConfig,
    );
    expect(mockSetupPrompts).toHaveBeenCalledWith(
      mockServer,
      expectedEsaConfig,
    );
    expect(mockServer.connect).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("test-server v1.0.0 started");
  });

  it("should set up transport error handlers", async () => {
    const mockConfig = createMockConfig();
    const mockServer = createMockServer();
    const mockTransport = createMockTransport();

    setupServerMocks(mockConfig, mockServer, mockTransport);

    await import("../index.js");

    expect(mockTransport.onclose).toBeDefined();
    expect(mockTransport.onerror).toBeDefined();

    mockTransport.onclose?.();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Transport closed");

    const testError = new Error("Test error");
    mockTransport.onerror?.(testError);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Transport error:", testError);
  });

  it("should handle server startup errors", async () => {
    const mockConfig = createMockConfig();
    const mockServer = createMockServer({ shouldFailConnect: true });
    const mockTransport = createMockTransport();

    setupServerMocks(mockConfig, mockServer, mockTransport);

    await import("../index.js");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Server startup error:",
      expect.any(Error),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
