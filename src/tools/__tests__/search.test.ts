import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpectedTransformed,
  createMockPost,
  createNullBodyPost,
  createWipPost,
} from "../../__tests__/fixtures/mock-post.js";
import type { createEsaClient } from "../../api_client/index.js";
import { searchPosts } from "../search.js";

describe("searchPosts", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return posts successfully", async () => {
    const mockPost1 = createMockPost();
    const mockPost2 = createWipPost({
      number: 456,
      name: "wip-post.md",
      full_name: "dev/wip-post.md",
    });

    mockClient.GET.mockResolvedValue({
      data: {
        posts: [mockPost1, mockPost2],
        prev_page: null,
        next_page: 2,
        total_count: 42,
        page: 1,
        per_page: 20,
        max_per_page: 100,
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await searchPosts(mockClient, {
      query: "test",
      teamName: "test-team",
    });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/posts", {
      params: {
        path: { team_name: "test-team" },
        query: {
          q: "test",
          sort: undefined,
          order: undefined,
          page: undefined,
          per_page: undefined,
          include: undefined,
        },
      },
    });

    const expectedResponse = [
      createExpectedTransformed(mockPost1),
      createExpectedTransformed(mockPost2),
    ];

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should handle search with all parameters", async () => {
    const mockPost = createMockPost();

    mockClient.GET.mockResolvedValue({
      data: {
        posts: [mockPost],
        prev_page: 1,
        next_page: 3,
        total_count: 100,
        page: 2,
        per_page: 10,
        max_per_page: 100,
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await searchPosts(mockClient, {
      query: "tag:release",
      teamName: "test-team",
      sort: "updated",
      order: "desc",
      page: 2,
      perPage: 10,
      include: "comments",
    });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/posts", {
      params: {
        path: { team_name: "test-team" },
        query: {
          q: "tag:release",
          sort: "updated",
          order: "desc",
          page: 2,
          per_page: 10,
          include: "comments",
        },
      },
    });

    const expectedResponse = [createExpectedTransformed(mockPost)];
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should handle empty search results", async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        posts: [],
        prev_page: null,
        next_page: null,
        total_count: 0,
        page: 1,
        per_page: 20,
        max_per_page: 100,
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await searchPosts(mockClient, {
      query: "nonexistent",
      teamName: "test-team",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify([], null, 2),
        },
      ],
    });
  });

  it("should handle multiple posts with various states", async () => {
    const shippedPost = createMockPost();
    const wipPost = createWipPost();
    const nullBodyPost = createNullBodyPost();

    mockClient.GET.mockResolvedValue({
      data: {
        posts: [shippedPost, wipPost, nullBodyPost],
        prev_page: null,
        next_page: null,
        total_count: 3,
        page: 1,
        per_page: 20,
        max_per_page: 100,
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await searchPosts(mockClient, {
      query: "",
      teamName: "test-team",
    });

    const parsedResult = JSON.parse((result.content[0] as TextContent).text);
    expect(parsedResult).toHaveLength(3);
    expect(parsedResult[0].wip).toBe("Shipped");
    expect(parsedResult[1].wip).toBe("WIP");
    expect(parsedResult[2].body_md).toBe(undefined);
  });

  it("should handle API errors", async () => {
    const mockError = {
      error: "unauthorized",
      message: "Invalid access token",
    };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 401,
      } as Response,
    });

    const result = await searchPosts(mockClient, {
      query: "test",
      teamName: "test-team",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error: ${JSON.stringify(mockError, null, 2)}`,
        },
      ],
    });
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await searchPosts(mockClient, {
      query: "test",
      teamName: "test-team",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Network connection failed",
        },
      ],
    });
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await searchPosts(mockClient, {
      query: "test",
      teamName: "test-team",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Unexpected error",
        },
      ],
    });
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await searchPosts(mockClient, {
      query: "test",
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

  it("should handle complex search queries", async () => {
    const mockPost = createMockPost();

    mockClient.GET.mockResolvedValue({
      data: {
        posts: [mockPost],
        prev_page: null,
        next_page: null,
        total_count: 1,
        page: 1,
        per_page: 20,
        max_per_page: 100,
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await searchPosts(mockClient, {
      query: "category:dev wip:false keyword:API",
      teamName: "test-team",
      sort: "best_match",
    });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/posts", {
      params: {
        path: { team_name: "test-team" },
        query: {
          q: "category:dev wip:false keyword:API",
          sort: "best_match",
          order: undefined,
          page: undefined,
          per_page: undefined,
          include: undefined,
        },
      },
    });

    const expectedResponse = [createExpectedTransformed(mockPost)];
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  describe("OR search suggestions", () => {
    it("should suggest OR search when AND query returns zero results", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          posts: [],
          prev_page: null,
          next_page: null,
          total_count: 0,
          page: 1,
          per_page: 20,
          max_per_page: 100,
        },
        error: undefined,
        response: {
          ok: true,
          status: 200,
        } as Response,
      });

      const result = await searchPosts(mockClient, {
        query: "foo bar",
        teamName: "test-team",
      });

      const text = (result.content[0] as TextContent).text;
      expect(text).toContain("foo OR bar");
      expect(text).toContain("No results found");
    });

    it("should not suggest OR search for single keyword with zero results", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          posts: [],
          prev_page: null,
          next_page: null,
          total_count: 0,
          page: 1,
          per_page: 20,
          max_per_page: 100,
        },
        error: undefined,
        response: {
          ok: true,
          status: 200,
        } as Response,
      });

      const result = await searchPosts(mockClient, {
        query: "nonexistent",
        teamName: "test-team",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify([], null, 2),
          },
        ],
      });
    });

    it("should not suggest OR search when query already uses OR", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          posts: [],
          prev_page: null,
          next_page: null,
          total_count: 0,
          page: 1,
          per_page: 20,
          max_per_page: 100,
        },
        error: undefined,
        response: {
          ok: true,
          status: 200,
        } as Response,
      });

      const result = await searchPosts(mockClient, {
        query: "foo OR bar",
        teamName: "test-team",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify([], null, 2),
          },
        ],
      });
    });

    it("should not suggest OR search when query uses pipe operator", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          posts: [],
          prev_page: null,
          next_page: null,
          total_count: 0,
          page: 1,
          per_page: 20,
          max_per_page: 100,
        },
        error: undefined,
        response: {
          ok: true,
          status: 200,
        } as Response,
      });

      const result = await searchPosts(mockClient, {
        query: "foo | bar",
        teamName: "test-team",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify([], null, 2),
          },
        ],
      });
    });

    it("should suggest OR search for operators-only query with zero results", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          posts: [],
          prev_page: null,
          next_page: null,
          total_count: 0,
          page: 1,
          per_page: 20,
          max_per_page: 100,
        },
        error: undefined,
        response: {
          ok: true,
          status: 200,
        } as Response,
      });

      const result = await searchPosts(mockClient, {
        query: "tag:foo category:bar",
        teamName: "test-team",
      });

      const text = (result.content[0] as TextContent).text;
      expect(text).toContain("tag:foo OR category:bar");
      expect(text).toContain("No results found");
    });
  });
});
