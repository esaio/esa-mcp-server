import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import { createSummarizePostSchema, summarizePost } from "../summarize-post.js";

describe("createSummarizePostSchema", () => {
  it("should create schema with proper fields", () => {
    const schema = createSummarizePostSchema();
    const shape = schema.shape;

    expect(shape.teamName).toBeDefined();
    expect(shape.postNumber).toBeDefined();
    expect(shape.format).toBeDefined();
  });

  it("should validate correct input", () => {
    const schema = createSummarizePostSchema();
    const result = schema.safeParse({
      teamName: "test-team",
      postNumber: "123",
      format: "bullet",
    });

    expect(result.success).toBe(true);
  });

  it("should allow optional format", () => {
    const schema = createSummarizePostSchema();
    const result = schema.safeParse({
      teamName: "test-team",
      postNumber: "123",
    });

    expect(result.success).toBe(true);
  });
});

describe("summarizePost", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPost = {
    number: 123,
    name: "test-post.md",
    full_name: "dev/test-post.md #tag1 #tag2",
    wip: false,
    body_md: "# Test Post\n\nThis is a test post content.",
    body_html: "<h1>Test Post</h1><p>This is a test post content.</p>",
    created_at: "2024-01-01T00:00:00+09:00",
    updated_at: "2024-01-02T00:00:00+09:00",
    message: "Update test post",
    url: "https://test-team.esa.example.com/posts/123",
    category: "dev",
    tags: ["tag1", "tag2"],
    revision_number: 3,
    created_by: {
      name: "user1",
      screen_name: "user1",
      icon: "https://example.com/icon1.png",
    },
    updated_by: {
      name: "user2",
      screen_name: "user2",
      icon: "https://example.com/icon2.png",
    },
    kind: "stock",
    comments_count: 5,
    tasks_count: 3,
    done_tasks_count: 2,
    stargazers_count: 10,
    watchers_count: 8,
    star: true,
    watch: false,
  };

  it("should generate a bullet format summary prompt", async () => {
    mockClient.GET.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "123",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
        },
      },
    );

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content.type).toBe("text");

    const promptText = (result.messages[0].content as TextContent).text;
    expect(promptText).toContain("Please summarize the following post:");
    expect(promptText).toContain("Title: test-post.md");
    expect(promptText).toContain(
      "URL: https://test-team.esa.example.com/posts/123",
    );
    expect(promptText).toContain("Author: user1");
    expect(promptText).toContain("Category: dev");
    expect(promptText).toContain("Tags: tag1, tag2");
    expect(promptText).toContain("# Test Post");
    expect(promptText).toContain("Please provide a summary in bullet points");
  });

  it("should generate a paragraph format summary prompt", async () => {
    mockClient.GET.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "123",
      format: "paragraph",
    });

    const promptText = (result.messages[0].content as TextContent).text;
    expect(promptText).toContain("Please provide a summary in 2-3 paragraphs");
  });

  it("should generate a keywords format summary prompt", async () => {
    mockClient.GET.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "123",
      format: "keywords",
    });

    const promptText = (result.messages[0].content as TextContent).text;
    expect(promptText).toContain(
      "Please extract and list 10-15 important keywords",
    );
  });

  it("should handle post without category and tags", async () => {
    const postWithoutCategoryAndTags = {
      ...mockPost,
      category: null,
      tags: [],
    };

    mockClient.GET.mockResolvedValue({
      data: postWithoutCategoryAndTags,
      error: undefined,
    });

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "456",
    });

    const promptText = (result.messages[0].content as TextContent).text;
    expect(promptText).not.toContain("Category:");
    expect(promptText).not.toContain("Tags:");
  });

  it("should handle post with null body_md", async () => {
    const postWithNullBody = {
      ...mockPost,
      body_md: null,
    };

    mockClient.GET.mockResolvedValue({
      data: postWithNullBody,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "789",
    });

    const promptText = (result.messages[0].content as TextContent).text;
    expect(promptText).not.toContain("Content:");
    expect(promptText).toContain("Please provide a summary in bullet points");
  });

  it("should handle API errors", async () => {
    const mockError = { error: "not_found", message: "Post not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "999",
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect(
      (result.messages[0].content as TextContent).text,
    ).toContain(JSON.stringify(mockError, null, 2));
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "123",
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect((result.messages[0].content as TextContent).text).toContain(
      "Network connection failed",
    );
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "123",
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect((result.messages[0].content as TextContent).text).toContain(
      "Unexpected error",
    );
  });

  it("should handle invalid post number", async () => {
    const result = await summarizePost(mockClient, {
      teamName: "test-team",
      postNumber: "invalid",
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect((result.messages[0].content as TextContent).text).toContain(
      "Post number must be a positive integer",
    );
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    await expect(
      summarizePost(mockClient, {
        teamName: "",
        postNumber: "123",
      }),
    ).rejects.toThrow(
      "Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
    );

    expect(mockClient.GET).not.toHaveBeenCalled();
  });
});
