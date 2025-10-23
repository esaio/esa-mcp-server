import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpectedTransformed,
  createMockPost,
  createNullBodyPost,
  createWipPost,
} from "../../__tests__/fixtures/mock-post.js";
import type { createEsaClient } from "../../api_client/index.js";
import { createPost, getPost, updatePost } from "../posts.js";

describe("getPost", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a post successfully", async () => {
    const mockPost = createMockPost();

    mockClient.GET.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getPost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
          query: { include: undefined, sign_attachment_urls: 600 },
        },
      },
    );

    const expectedResponse = createExpectedTransformed(mockPost);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should return a post with comments when include parameter is specified", async () => {
    const mockPost = createWipPost({
      body_md: "Post content",
      body_html: "<p>Post content</p>",
      comments_count: 2,
      stargazers_count: 3,
      watchers_count: 5,
      comments: [
        {
          id: 1,
          post_number: 123,
          body_md: "First comment",
          body_html: "<p>First comment</p>",
          created_at: "2024-01-03T10:00:00+09:00",
          updated_at: "2024-01-03T10:00:00+09:00",
          created_by: {
            name: "commenter1",
            screen_name: "commenter1",
            icon: "https://example.com/icon4.png",
            myself: false,
          },
          url: "",
          stargazers_count: 0,
          star: false,
        },
        {
          id: 2,
          post_number: 123,
          body_md: "Second comment",
          body_html: "<p>Second comment</p>",
          created_at: "2024-01-03T11:00:00+09:00",
          updated_at: "2024-01-03T11:00:00+09:00",
          created_by: {
            name: "commenter2",
            screen_name: "commenter2",
            icon: "https://example.com/icon5.png",
            myself: false,
          },
          url: "",
          stargazers_count: 0,
          star: false,
        },
      ],
    });

    mockClient.GET.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getPost(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      include: "comments",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 456 },
          query: { include: "comments", sign_attachment_urls: 600 },
        },
      },
    );

    const parsedResult = JSON.parse(result.content[0].text as string);
    expect(parsedResult.wip).toBe("WIP");
    expect(parsedResult.kind).toBe("flow");
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

    const result = await getPost(mockClient, {
      teamName: "test-team",
      postNumber: 999,
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

    const result = await getPost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
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

    const result = await getPost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
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

  it("should handle post with undefined body_md", async () => {
    const mockPost = createNullBodyPost({
      number: 789,
      name: "empty-post.md",
      full_name: "dev/empty-post.md",
      url: "https://test-team.esa.example.com/posts/789",
      message: "Empty post",
      created_at: "2024-01-05T00:00:00+09:00",
      updated_at: "2024-01-05T00:00:00+09:00",
      comments_count: 0,
      tasks_count: 0,
      done_tasks_count: 0,
      stargazers_count: 0,
      watchers_count: 0,
      star: false,
      watch: false,
    });

    mockClient.GET.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getPost(mockClient, {
      teamName: "test-team",
      postNumber: 789,
    });

    const parsedResult = JSON.parse(result.content[0].text as string);
    expect(parsedResult.body_md).toBe(undefined);
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getPost(mockClient, {
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

describe("createPost", () => {
  const mockClient = {
    POST: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    POST: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a post successfully", async () => {
    const mockPost = createMockPost();

    mockClient.POST.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    const result = await createPost(mockClient, {
      teamName: "test-team",
      name: "Test Post",
      bodyMd: "# Test Content\n\nThis is a test post.",
      tags: ["test", "sample"],
      category: "dev/docs",
      wip: false,
      message: "Initial creation",
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: "test-team" },
        },
        body: {
          post: {
            name: "Test Post",
            body_md: "# Test Content\n\nThis is a test post.",
            tags: ["test", "sample"],
            category: "dev/docs",
            wip: false,
            message: "Initial creation",
          },
        },
      },
    );

    const expectedResponse = createExpectedTransformed(mockPost);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should split name into category and name when name contains slash", async () => {
    const mockPost = createMockPost();

    mockClient.POST.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    await createPost(mockClient, {
      teamName: "test-team",
      name: "docs/api/v2/authentication.md",
      bodyMd: "# Authentication Guide",
      wip: false,
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: "test-team" },
        },
        body: {
          post: {
            name: "authentication.md",
            body_md: "# Authentication Guide",
            tags: undefined,
            category: "docs/api/v2",
            wip: false,
            message: undefined,
          },
        },
      },
    );
  });

  it("should not split name when category is already specified", async () => {
    const mockPost = createMockPost();

    mockClient.POST.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    await createPost(mockClient, {
      teamName: "test-team",
      name: "File/Path/Name.md",
      category: "specified/category",
      wip: false,
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: "test-team" },
        },
        body: {
          post: {
            name: "File/Path/Name.md",
            body_md: undefined,
            tags: undefined,
            category: "specified/category",
            wip: false,
            message: undefined,
          },
        },
      },
    );
  });

  it("should create a WIP post with minimal parameters", async () => {
    const mockPost = createWipPost();

    mockClient.POST.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    const result = await createPost(mockClient, {
      teamName: "test-team",
      name: "WIP Post",
      wip: true,
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: "test-team" },
        },
        body: {
          post: {
            name: "WIP Post",
            body_md: undefined,
            tags: undefined,
            category: undefined,
            wip: true,
            message: undefined,
          },
        },
      },
    );

    const parsedResult = JSON.parse(result.content[0].text as string);
    expect(parsedResult.wip).toBe("WIP");
  });

  it("should handle API errors when creating a post", async () => {
    const mockError = { error: "bad_request", message: "Invalid post data" };

    mockClient.POST.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 400,
      } as Response,
    });

    const result = await createPost(mockClient, {
      teamName: "test-team",
      name: "",
      wip: true,
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

  it("should handle network errors when creating a post", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.POST.mockRejectedValue(networkError);

    const result = await createPost(mockClient, {
      teamName: "test-team",
      name: "Test Post",
      wip: true,
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

  it("should handle non-Error exceptions when creating a post", async () => {
    mockClient.POST.mockRejectedValue("Unexpected error");

    const result = await createPost(mockClient, {
      teamName: "test-team",
      name: "Test Post",
      wip: true,
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

  it("should create a post without body", async () => {
    const mockPost = createNullBodyPost({
      number: 999,
      name: "empty-body.md",
      full_name: "dev/empty-body.md",
    });

    mockClient.POST.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    const result = await createPost(mockClient, {
      teamName: "test-team",
      name: "Empty Body Post",
      category: "dev",
      wip: false,
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: "test-team" },
        },
        body: {
          post: {
            name: "Empty Body Post",
            body_md: undefined,
            tags: undefined,
            category: "dev",
            wip: false,
            message: undefined,
          },
        },
      },
    );

    const parsedResult = JSON.parse(result.content[0].text as string);
    expect(parsedResult.body_md).toBe(undefined);
  });
});

describe("updatePost", () => {
  const mockClient = {
    PATCH: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    PATCH: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a post successfully", async () => {
    const mockPost = createMockPost();

    mockClient.PATCH.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      name: "Updated Post Title",
      bodyMd: "# Updated Content\n\nThis is updated content.",
      tags: ["updated", "test"],
      category: "dev/updated",
      wip: false,
      message: "Updated post content",
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
        },
        body: {
          post: {
            name: "Updated Post Title",
            body_md: "# Updated Content\n\nThis is updated content.",
            tags: ["updated", "test"],
            category: "dev/updated",
            wip: false,
            message: "Updated post content",
            original_revision: undefined,
          },
        },
      },
    );

    const expectedResponse = createExpectedTransformed(mockPost);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should split name into category and name when name contains slash", async () => {
    const mockPost = createMockPost();

    mockClient.PATCH.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      name: "dev/guidelines/coding-standards.md",
      message: "Updated title structure",
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
        },
        body: {
          post: {
            name: "coding-standards.md",
            body_md: undefined,
            tags: undefined,
            category: "dev/guidelines",
            wip: undefined,
            message: "Updated title structure",
            original_revision: undefined,
          },
        },
      },
    );
  });

  it("should not split name when category is already specified", async () => {
    const mockPost = createMockPost();

    mockClient.PATCH.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      name: "File/Path/Name.md",
      category: "specified/category",
      message: "Update message",
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
        },
        body: {
          post: {
            name: "File/Path/Name.md",
            body_md: undefined,
            tags: undefined,
            category: "specified/category",
            wip: undefined,
            message: "Update message",
            original_revision: undefined,
          },
        },
      },
    );
  });

  it("should update a post with original revision for conflict check", async () => {
    const mockPost = createMockPost();

    mockClient.PATCH.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      name: "Updated Title",
      originalRevision: {
        bodyMd: "Original content",
        number: 5,
        user: "test-user",
      },
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
        },
        body: {
          post: {
            name: "Updated Title",
            body_md: undefined,
            tags: undefined,
            category: undefined,
            wip: undefined,
            message: undefined,
            original_revision: {
              body_md: "Original content",
              number: 5,
              user: "test-user",
            },
          },
        },
      },
    );

    const expectedResponse = createExpectedTransformed(mockPost);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should update only WIP status", async () => {
    const mockPost = createWipPost();

    mockClient.PATCH.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      wip: true,
      message: "Marking as WIP",
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 456 },
        },
        body: {
          post: {
            name: undefined,
            body_md: undefined,
            tags: undefined,
            category: undefined,
            wip: true,
            message: "Marking as WIP",
            original_revision: undefined,
          },
        },
      },
    );

    const parsedResult = JSON.parse(result.content[0].text as string);
    expect(parsedResult.wip).toBe("WIP");
  });

  it("should handle API errors when updating a post", async () => {
    const mockError = { error: "conflict", message: "Post has been modified" };

    mockClient.PATCH.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 409,
      } as Response,
    });

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      name: "Updated Title",
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

  it("should handle network errors when updating a post", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.PATCH.mockRejectedValue(networkError);

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      bodyMd: "Updated content",
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

  it("should handle non-Error exceptions when updating a post", async () => {
    mockClient.PATCH.mockRejectedValue("Unexpected error");

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      tags: ["new-tag"],
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

  it("should update a post with empty body", async () => {
    const mockPost = createNullBodyPost({
      number: 789,
      name: "updated-empty.md",
      full_name: "dev/updated-empty.md",
    });

    mockClient.PATCH.mockResolvedValue({
      data: mockPost,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await updatePost(mockClient, {
      teamName: "test-team",
      postNumber: 789,
      bodyMd: "",
      category: "dev",
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: "test-team", post_number: 789 },
        },
        body: {
          post: {
            name: undefined,
            body_md: "",
            tags: undefined,
            category: "dev",
            wip: undefined,
            message: undefined,
            original_revision: undefined,
          },
        },
      },
    );

    const parsedResult = JSON.parse(result.content[0].text as string);
    expect(parsedResult.body_md).toBe(undefined);
  });
});
