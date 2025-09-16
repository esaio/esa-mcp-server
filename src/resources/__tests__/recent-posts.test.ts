import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpectedTransformed,
  createLongContentPost,
  createMockPost,
  createNullBodyPost,
  createWipPost,
} from "../../__tests__/fixtures/mock-post.js";
import type { createEsaClient } from "../../api_client/index.js";
import { getRecentPosts } from "../recent-posts.js";

describe("getRecentPosts", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  const testUri = "esa://teams/test-team/posts/recent";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return recent posts successfully", async () => {
    const mockPosts = [
      createMockPost({
        number: 1,
        name: "post1.md",
        full_name: "dev/post1.md #tag1 #tag2",
        body_md:
          "This is a test post content that is quite long and should be truncated",
        body_html: "<p>This is a test post content</p>",
        url: "https://test-team.esa.example.com/posts/1",
        comments_count: 3,
        tasks_count: 5,
        done_tasks_count: 2,
        watchers_count: 7,
        star: false,
        watch: false,
      }),
      createWipPost({
        number: 2,
        name: "post2.md",
        full_name: "docs/post2.md #wip",
        body_md: "Short content",
        body_html: "<p>Short content</p>",
        url: "https://test-team.esa.example.com/posts/2",
        created_at: "2024-01-03T00:00:00+09:00",
        updated_at: "2024-01-04T00:00:00+09:00",
        stargazers_count: 1,
        watchers_count: 2,
        star: true,
        watch: true,
      }),
    ];

    const mockResponse = {
      posts: mockPosts,
      page: 1,
      per_page: 20,
      total_count: 2,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockResponse,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/posts", {
      params: {
        path: { team_name: "test-team" },
        query: {
          sort: "updated",
          order: "desc",
        },
      },
    });

    const expectedResponse = {
      posts: mockPosts.map((post) => createExpectedTransformed(post)),
      page: 1,
      per_page: 20,
      total_count: 2,
      max_per_page: 100,
    };

    expect(result).toEqual({
      contents: [
        {
          uri: testUri,
          mimeType: "application/json",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should truncate long body_md content", async () => {
    const mockPost = createLongContentPost(600);

    mockClient.GET.mockResolvedValue({
      data: { posts: [mockPost] },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    const parsedResult = JSON.parse(result.contents[0].text as string);
    expect(parsedResult.posts[0].body_md).toBe(`${"a".repeat(500)}...`);
  });

  it("should handle empty posts array", async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        posts: [],
        page: 1,
        per_page: 20,
        total_count: 0,
        max_per_page: 100,
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    const parsedResult = JSON.parse(result.contents[0].text as string);
    expect(parsedResult.posts).toEqual([]);
    expect(parsedResult.total_count).toBe(0);
  });

  it("should handle API errors", async () => {
    const mockError = { error: "unauthorized", message: "Invalid token" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    expect(result).toEqual({
      contents: [
        {
          uri: testUri,
          mimeType: "application/json",
          text: `Error: ${JSON.stringify(mockError, null, 2)}`,
        },
      ],
    });
  });

  it("should handle response status errors", async () => {
    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: {
        ok: false,
        status: 500,
      } as Response,
    });

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    expect(result).toEqual({
      contents: [
        {
          uri: testUri,
          mimeType: "application/json",
          text: "Error: API Response(status: 500)",
        },
      ],
    });
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    expect(result).toEqual({
      contents: [
        {
          uri: testUri,
          mimeType: "application/json",
          text: "Error: Network connection failed",
        },
      ],
    });
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    expect(result).toEqual({
      contents: [
        {
          uri: testUri,
          mimeType: "application/json",
          text: "Error: Unexpected error",
        },
      ],
    });
  });

  it("should handle posts with undefined body_md", async () => {
    const mockPost = createNullBodyPost();

    mockClient.GET.mockResolvedValue({
      data: { posts: [mockPost] },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getRecentPosts(mockClient, {
      teamName: "test-team",
      uri: testUri,
    });

    const parsedResult = JSON.parse(result.contents[0].text as string);
    expect(parsedResult.posts[0].body_md).toBe(undefined);
  });
});
