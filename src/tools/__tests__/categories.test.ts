import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import { getCategories } from "../categories.js";

describe("getCategories", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch all category paths", async () => {
    const mockResponse = [
      { path: null, posts: 5 },
      { path: "dev", posts: 10 },
      { path: "dev/docs", posts: 3 },
      { path: "design", posts: 7 },
    ];

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getCategories(mockClient, {
      teamName: "test-team",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            prefix: undefined,
            suffix: undefined,
            match: undefined,
            exact_match: undefined,
          },
        },
      },
    );

    expect((result.content[0] as TextContent).text).toContain("dev");
    expect((result.content[0] as TextContent).text).toContain("design");
  });

  it("should support prefix filter", async () => {
    const mockResponse = [
      { path: "dev", posts: 10 },
      { path: "dev/docs", posts: 3 },
    ];

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getCategories(mockClient, {
      teamName: "test-team",
      prefix: "dev",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            prefix: "dev",
            suffix: undefined,
            match: undefined,
            exact_match: undefined,
          },
        },
      },
    );

    expect((result.content[0] as TextContent).text).toContain("dev");
  });

  it("should support multiple filters", async () => {
    const mockResponse = [{ path: "dev/docs", posts: 3 }];

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getCategories(mockClient, {
      teamName: "test-team",
      prefix: "dev",
      suffix: "docs",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            prefix: "dev",
            suffix: "docs",
            match: undefined,
            exact_match: undefined,
          },
        },
      },
    );

    expect((result.content[0] as TextContent).text).toContain("dev/docs");
  });

  it("should handle API errors", async () => {
    const mockError = { error: "forbidden", message: "Access denied" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: { ok: false, status: 403 } as Response,
    });

    const result = await getCategories(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain("forbidden");
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getCategories(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Network connection failed",
    );
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getCategories(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Unexpected error",
    );
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getCategories(mockClient, {
      teamName: "",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
        },
      ],
    });

    expect(mockClient.GET).not.toHaveBeenCalled();
  });
});
