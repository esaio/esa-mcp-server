import createClient from "openapi-fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../../package.json" with { type: "json" };
import type { paths } from "../../generated/api-types.js";
import { createEsaClient } from "../index.js";

// Mock openapi-fetch to test client configuration without actual HTTP calls
vi.mock("openapi-fetch", () => ({
  default: vi.fn(),
}));

describe("createEsaClient", () => {
  // Create mock client with use method to verify middleware registration
  const createMockClient = () =>
    ({
      use: vi.fn(),
    }) as unknown as ReturnType<typeof createClient<paths>>;

  // Setup test environment with configurable parameters for different test scenarios
  const setupTest = (overrides?: {
    apiBaseUrl?: string;
    apiAccessToken?: string;
  }) => {
    const config = {
      apiBaseUrl: overrides?.apiBaseUrl ?? "https://api.esa.example.com",
      apiAccessToken: overrides?.apiAccessToken ?? "test-token",
    };

    const mockClient = createMockClient();
    const mockCreateClient = vi.mocked(createClient);
    mockCreateClient.mockReturnValue(mockClient);

    return { config, mockClient, mockCreateClient };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create client with correct baseUrl", () => {
    const { config, mockCreateClient } = setupTest();

    createEsaClient(config.apiAccessToken, config.apiBaseUrl);

    expect(mockCreateClient).toHaveBeenCalledWith({
      baseUrl: config.apiBaseUrl,
    });
  });

  it("should add User-Agent and Auth middleware to client", () => {
    const { config, mockClient } = setupTest();

    createEsaClient(config.apiAccessToken, config.apiBaseUrl);

    expect(mockClient.use).toHaveBeenCalledTimes(2);
    expect(mockClient.use).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        onRequest: expect.any(Function),
      }),
    );
    expect(mockClient.use).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        onRequest: expect.any(Function),
      }),
    );
  });

  it("should return the configured client", () => {
    const { config, mockClient } = setupTest();

    const result = createEsaClient(config.apiAccessToken, config.apiBaseUrl);

    expect(result).toBe(mockClient);
  });

  it("should set User-Agent header in middleware", async () => {
    const { config, mockClient } = setupTest();

    createEsaClient(config.apiAccessToken, config.apiBaseUrl);

    // Get the User-Agent middleware function (first one registered)
    const useMock = mockClient.use as ReturnType<typeof vi.fn>;
    const userAgentMiddleware = useMock.mock.calls[0][0];

    // Create mock request to verify User-Agent header is set
    const mockRequest = {
      headers: {
        set: vi.fn(),
      },
    };

    await userAgentMiddleware.onRequest({ request: mockRequest });

    expect(mockRequest.headers.set).toHaveBeenCalledWith(
      "User-Agent",
      `esa-mcp-server/${packageJson.version} (official)`,
    );
  });

  it("should set Authorization header in middleware", async () => {
    const { config, mockClient } = setupTest();

    createEsaClient(config.apiAccessToken, config.apiBaseUrl);

    // Get the Auth middleware function (second one registered)
    const useMock = mockClient.use as ReturnType<typeof vi.fn>;
    const authMiddleware = useMock.mock.calls[1][0];

    // Create mock request to verify Authorization header is set
    const mockRequest = {
      headers: {
        set: vi.fn(),
      },
    };

    await authMiddleware.onRequest({ request: mockRequest });

    expect(mockRequest.headers.set).toHaveBeenCalledWith(
      "Authorization",
      `Bearer ${config.apiAccessToken}`,
    );
  });

  it("should create separate client instances for different tokens", () => {
    const { config, mockCreateClient, mockClient } = setupTest();
    const token1 = "token-1";
    const token2 = "token-2";

    createEsaClient(token1, config.apiBaseUrl);
    createEsaClient(token2, config.apiBaseUrl);

    expect(mockCreateClient).toHaveBeenCalledTimes(2);
    expect(mockClient.use).toHaveBeenCalledTimes(4); // 2 middlewares × 2 clients
  });

  it("should create separate client instances for different base URLs", () => {
    const { config, mockCreateClient } = setupTest();
    const url1 = "https://api.esa.example.com";
    const url2 = "https://api.example.com";

    createEsaClient(config.apiAccessToken, url1);
    createEsaClient(config.apiAccessToken, url2);

    expect(mockCreateClient).toHaveBeenCalledWith({ baseUrl: url1 });
    expect(mockCreateClient).toHaveBeenCalledWith({ baseUrl: url2 });
  });
});
