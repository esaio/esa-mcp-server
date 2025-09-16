import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockPost } from "../../__tests__/fixtures/mock-post.js";
import type { createEsaClient } from "../../api_client/index.js";
import { archivePost, duplicatePost, shipPost } from "../post-actions.js";
import * as postsModule from "../posts.js";

vi.mock("../posts.js", () => ({
  updatePost: vi.fn(),
  createPost: vi.fn(),
}));

describe("archivePost", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  const mockUpdatePost = vi.mocked(postsModule.updatePost);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call updatePost with Archived category for post without category", async () => {
    const currentPost = createMockPost({
      number: 123,
      category: "",
    });

    mockClient.GET.mockResolvedValue({
      data: currentPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockUpdatePost.mockResolvedValue({
      content: [{ type: "text", text: "Updated post" }],
    });

    await archivePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockUpdatePost).toHaveBeenCalledWith(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      category: "Archived",
      message: "Archive post",
    });
  });

  it("should call updatePost with Archived/ prefix for post with category", async () => {
    const currentPost = createMockPost({
      number: 123,
      category: "dev/docs",
    });

    mockClient.GET.mockResolvedValue({
      data: currentPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockUpdatePost.mockResolvedValue({
      content: [{ type: "text", text: "Updated post" }],
    });

    await archivePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      message: "Custom archive message",
    });

    expect(mockUpdatePost).toHaveBeenCalledWith(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      category: "Archived/dev/docs",
      message: "Custom archive message",
    });
  });

  it("should return already archived message without calling updatePost", async () => {
    const currentPost = createMockPost({
      number: 123,
      category: "Archived/dev/docs",
    });

    mockClient.GET.mockResolvedValue({
      data: currentPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await archivePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockUpdatePost).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain("Post is already archived");
    expect(result.content[0].text).toContain("Archived/dev/docs");
  });

  it("should handle GET error", async () => {
    const mockError = { error: "not_found", message: "Post not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await archivePost(mockClient, {
      teamName: "test-team",
      postNumber: 999,
    });

    expect(result.content[0].text).toContain("not_found");
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await archivePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(result.content[0].text).toContain("Network connection failed");
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await archivePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(result.content[0].text).toContain("Unexpected error");
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await archivePost(mockClient, {
      teamName: "",
      postNumber: 123,
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

describe("shipPost", () => {
  const mockClient = {} as ReturnType<typeof createEsaClient>;
  const mockUpdatePost = vi.mocked(postsModule.updatePost);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call updatePost with wip: false", async () => {
    mockUpdatePost.mockResolvedValue({
      content: [{ type: "text", text: "Updated post" }],
    });

    await shipPost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockUpdatePost).toHaveBeenCalledWith(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      wip: false,
      message: "Ship It!",
    });
  });

  it("should handle updatePost errors", async () => {
    mockUpdatePost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Post not found" }],
    });

    const result = await shipPost(mockClient, {
      teamName: "test-team",
      postNumber: 999,
    });

    expect(result.content[0].text).toContain("Error:");
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");
    mockUpdatePost.mockRejectedValue(networkError);

    const result = await shipPost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(result.content[0].text).toContain("Network connection failed");
  });

  it("should handle non-Error exceptions", async () => {
    mockUpdatePost.mockRejectedValue("Unexpected error");

    const result = await shipPost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(result.content[0].text).toContain("Unexpected error");
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await shipPost(mockClient, {
      teamName: "",
      postNumber: 123,
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
        },
      ],
    });

    expect(mockUpdatePost).not.toHaveBeenCalled();
  });
});

describe("duplicatePost", () => {
  const mockClient = {
    GET: vi.fn(),
    POST: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
    POST: ReturnType<typeof vi.fn>;
  };

  const mockCreatePost = vi.mocked(postsModule.createPost);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call createPost with correct parameters", async () => {
    const mockPostNew = {
      name: "docs/api/authentication",
      body_md: "# Authentication\n\nThis is the authentication guide.",
    };

    mockClient.GET.mockResolvedValue({
      data: { post: mockPostNew },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockCreatePost.mockResolvedValue({
      content: [{ type: "text", text: "Created post" }],
    });

    await duplicatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/new",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            parent_post_id: 123,
          },
        },
      },
    );

    expect(mockCreatePost).toHaveBeenCalledWith(mockClient, {
      teamName: "test-team",
      name: "docs/api/authentication",
      bodyMd: "# Authentication\n\nThis is the authentication guide.",
      wip: true,
    });
  });

  it("should use targetTeamName when provided", async () => {
    const mockPostNew = {
      name: "simple-post",
      body_md: "This is a simple post.",
    };

    mockClient.GET.mockResolvedValue({
      data: { post: mockPostNew },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockCreatePost.mockResolvedValue({
      content: [{ type: "text", text: "Created post" }],
    });

    await duplicatePost(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      targetTeamName: "another-team",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/new",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            parent_post_id: 456,
          },
        },
      },
    );

    expect(mockCreatePost).toHaveBeenCalledWith(mockClient, {
      teamName: "another-team",
      name: "simple-post",
      bodyMd: "This is a simple post.",
      wip: true,
    });
  });

  it("should handle API error", async () => {
    const mockError = { error: "not_found", message: "Post not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await duplicatePost(mockClient, {
      teamName: "test-team",
      postNumber: 999,
    });

    expect(result.content[0].text).toContain("not_found");
  });

  it("should handle response not ok", async () => {
    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: {
        ok: false,
        status: 500,
      } as Response,
    });

    const result = await duplicatePost(mockClient, {
      teamName: "test-team",
      postNumber: 789,
    });

    expect(result.content[0].text).toContain("500");
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await duplicatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(result.content[0].text).toContain("Network connection failed");
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await duplicatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(result.content[0].text).toContain("Unexpected error");
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await duplicatePost(mockClient, {
      teamName: "",
      postNumber: 123,
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
