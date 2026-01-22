import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import {
  getAllCategoryPaths,
  getCategories,
  getTopCategories,
} from "../categories.js";

describe("getCategories", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch categories for a specific path", async () => {
    const mockResponse = {
      current_category: "dev/docs",
      categories: [
        {
          name: "api",
          full_name: "dev/docs/api",
          count: 5,
          has_child: true,
        },
      ],
      total_count: 1,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getCategories(mockClient, {
      teamName: "test-team",
      select: "dev/docs",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            select: "dev/docs",
            include: undefined,
            descendant_posts: undefined,
            page: undefined,
            per_page: undefined,
          },
        },
      },
    );

    expect((result.content[0] as TextContent).text).toContain("dev/docs");
  });

  it("should handle API errors", async () => {
    const mockError = { error: "not_found", message: "Category not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: { ok: false, status: 404 } as Response,
    });

    const result = await getCategories(mockClient, {
      teamName: "test-team",
      select: "nonexistent",
    });

    expect((result.content[0] as TextContent).text).toContain("not_found");
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getCategories(mockClient, {
      teamName: "test-team",
      select: "dev/docs",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Network connection failed",
    );
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getCategories(mockClient, {
      teamName: "test-team",
      select: "dev/docs",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Unexpected error",
    );
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getCategories(mockClient, {
      teamName: "",
      select: "dev",
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

describe("getTopCategories", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch top-level categories", async () => {
    const mockResponse = {
      current_category: "",
      categories: [
        { name: "dev", full_name: "dev", count: 15, has_child: true },
        { name: "design", full_name: "design", count: 8, has_child: false },
      ],
      total_count: 2,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getTopCategories(mockClient, {
      teamName: "test-team",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/top",
      {
        params: { path: { team_name: "test-team" } },
      },
    );

    expect((result.content[0] as TextContent).text).toContain("dev");
    expect((result.content[0] as TextContent).text).toContain("design");
  });

  it("should handle API errors", async () => {
    const mockError = { error: "forbidden", message: "Access denied" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: { ok: false, status: 403 } as Response,
    });

    const result = await getTopCategories(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain("forbidden");
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getTopCategories(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Network connection failed",
    );
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getTopCategories(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Unexpected error",
    );
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getTopCategories(mockClient, {
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

describe("getAllCategoryPaths", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch all category paths with v=2 pagination", async () => {
    const mockResponse = {
      categories: [
        { path: null, posts: 5 },
        { path: "dev", posts: 10 },
        { path: "dev/docs", posts: 3 },
        { path: "design", posts: 7 },
      ],
      total_count: 4,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getAllCategoryPaths(mockClient, {
      teamName: "test-team",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            v: 2,
            page: undefined,
            per_page: undefined,
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
    const mockResponse = {
      categories: [
        { path: "dev", posts: 10 },
        { path: "dev/docs", posts: 3 },
      ],
      total_count: 2,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getAllCategoryPaths(mockClient, {
      teamName: "test-team",
      prefix: "dev",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            v: 2,
            page: undefined,
            per_page: undefined,
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
    const mockResponse = {
      categories: [{ path: "dev/docs", posts: 3 }],
      total_count: 1,
      per_page: 20,
      page: 1,
      prev_page: null,
      next_page: null,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getAllCategoryPaths(mockClient, {
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
            v: 2,
            page: undefined,
            per_page: undefined,
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

  it("should support pagination parameters", async () => {
    const mockResponse = {
      categories: [
        { path: "dev", posts: 10 },
        { path: "design", posts: 5 },
      ],
      total_count: 50,
      per_page: 2,
      page: 2,
      prev_page: 1,
      next_page: 3,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: { ok: true, status: 200 } as Response,
    });

    const result = await getAllCategoryPaths(mockClient, {
      teamName: "test-team",
      page: 2,
      perPage: 2,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            v: 2,
            page: 2,
            per_page: 2,
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
    expect((result.content[0] as TextContent).text).toContain("total_count");
  });

  it("should handle API errors", async () => {
    const mockError = { error: "forbidden", message: "Access denied" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: { ok: false, status: 403 } as Response,
    });

    const result = await getAllCategoryPaths(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain("forbidden");
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getAllCategoryPaths(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Network connection failed",
    );
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getAllCategoryPaths(mockClient, {
      teamName: "test-team",
    });

    expect((result.content[0] as TextContent).text).toContain(
      "Unexpected error",
    );
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getAllCategoryPaths(mockClient, {
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
