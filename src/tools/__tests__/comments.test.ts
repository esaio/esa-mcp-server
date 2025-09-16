import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpectedTransformedComment,
  createMockComment,
  createMockCommentList,
} from "../../__tests__/fixtures/mock-comment.js";
import type { createEsaClient } from "../../api_client/index.js";
import {
  createComment,
  deleteComment,
  getComment,
  getPostComments,
  getTeamComments,
  updateComment,
} from "../comments.js";

describe("getComment", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get a comment successfully", async () => {
    const mockComment = createMockComment();

    mockClient.GET.mockResolvedValue({
      data: mockComment,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: "test-team", comment_id: 123 },
          query: { include: undefined },
        },
      },
    );

    const expectedResponse = createExpectedTransformedComment(mockComment);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should get a comment with stargazers when include parameter is specified", async () => {
    const mockComment = createMockComment({
      stargazers_count: 3,
      star: true,
    });

    mockClient.GET.mockResolvedValue({
      data: mockComment,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
      include: "stargazers",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: "test-team", comment_id: 123 },
          query: { include: "stargazers" },
        },
      },
    );

    const expectedResponse = createExpectedTransformedComment(mockComment);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should handle API errors when getting a comment", async () => {
    const mockError = { error: "not_found", message: "Comment not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await getComment(mockClient, {
      teamName: "test-team",
      commentId: 999,
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

  it("should handle network errors when getting a comment", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
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

  it("should handle non-Error exceptions when getting a comment", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
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
    const result = await getComment(mockClient, {
      teamName: "",
      commentId: 123,
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

describe("createComment", () => {
  const mockClient = {
    POST: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    POST: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a comment successfully", async () => {
    const mockComment = {
      id: 123,
      post_number: 456,
      body_md: "This is a test comment",
      body_html: "<p>This is a test comment</p>",
      created_at: "2024-01-01T00:00:00+09:00",
      updated_at: "2024-01-01T00:00:00+09:00",
      url: "https://test-team.esa.example.com/posts/456#comment-123",
      created_by: {
        name: "Test User",
        screen_name: "testuser",
        icon: "https://example.com/icon.png",
        myself: true,
      },
      stargazers_count: 0,
      star: false,
    };

    mockClient.POST.mockResolvedValue({
      data: mockComment,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    const result = await createComment(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      bodyMd: "This is a test comment",
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}/comments",
      {
        params: {
          path: { team_name: "test-team", post_number: 456 },
        },
        body: {
          comment: {
            body_md: "This is a test comment",
            user: undefined,
          },
        },
      },
    );

    const expectedResponse = createExpectedTransformedComment(mockComment);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should create a comment with user parameter", async () => {
    const mockComment = createMockComment({
      id: 124,
      body_md: "Comment by specific user",
      body_html: "<p>Comment by specific user</p>",
      url: "https://test-team.esa.example.com/posts/456#comment-124",
      created_by: {
        name: "Specific User",
        screen_name: "specificuser",
        icon: "https://example.com/icon2.png",
        myself: false,
      },
      stargazers_count: 0,
      star: false,
    });

    mockClient.POST.mockResolvedValue({
      data: mockComment,
      error: undefined,
      response: {
        ok: true,
        status: 201,
      } as Response,
    });

    const result = await createComment(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      bodyMd: "Comment by specific user",
      user: "specificuser",
    });

    expect(mockClient.POST).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}/comments",
      {
        params: {
          path: { team_name: "test-team", post_number: 456 },
        },
        body: {
          comment: {
            body_md: "Comment by specific user",
            user: "specificuser",
          },
        },
      },
    );

    const expectedResponse = createExpectedTransformedComment(mockComment);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should handle API errors when creating a comment", async () => {
    const mockError = { error: "bad_request", message: "Invalid comment data" };

    mockClient.POST.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 400,
      } as Response,
    });

    const result = await createComment(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      bodyMd: "",
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

  it("should handle network errors when creating a comment", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.POST.mockRejectedValue(networkError);

    const result = await createComment(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      bodyMd: "Test comment",
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

  it("should handle non-Error exceptions when creating a comment", async () => {
    mockClient.POST.mockRejectedValue("Unexpected error");

    const result = await createComment(mockClient, {
      teamName: "test-team",
      postNumber: 456,
      bodyMd: "Test comment",
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
    const result = await createComment(mockClient, {
      teamName: "",
      postNumber: 456,
      bodyMd: "Test comment",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
        },
      ],
    });

    expect(mockClient.POST).not.toHaveBeenCalled();
  });
});

describe("updateComment", () => {
  const mockClient = {
    PATCH: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    PATCH: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a comment successfully", async () => {
    const mockComment = createMockComment({
      body_md: "Updated comment content",
      body_html: "<p>Updated comment content</p>",
      updated_at: "2024-01-01T01:00:00+09:00",
      stargazers_count: 0,
      star: false,
    });

    mockClient.PATCH.mockResolvedValue({
      data: mockComment,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await updateComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
      bodyMd: "Updated comment content",
    });

    expect(mockClient.PATCH).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: "test-team", comment_id: 123 },
        },
        body: {
          comment: {
            body_md: "Updated comment content",
            user: undefined,
          },
        },
      },
    );

    const expectedResponse = createExpectedTransformedComment(mockComment);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should handle API errors when updating a comment", async () => {
    const mockError = { error: "not_found", message: "Comment not found" };

    mockClient.PATCH.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await updateComment(mockClient, {
      teamName: "test-team",
      commentId: 999,
      bodyMd: "Updated content",
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

  it("should handle network errors when updating a comment", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.PATCH.mockRejectedValue(networkError);

    const result = await updateComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
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

  it("should handle non-Error exceptions when updating a comment", async () => {
    mockClient.PATCH.mockRejectedValue("Unexpected error");

    const result = await updateComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
      bodyMd: "Updated content",
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
    const result = await updateComment(mockClient, {
      teamName: "",
      commentId: 123,
      bodyMd: "Updated content",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
        },
      ],
    });

    expect(mockClient.PATCH).not.toHaveBeenCalled();
  });
});

describe("deleteComment", () => {
  const mockClient = {
    DELETE: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    DELETE: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a comment successfully", async () => {
    mockClient.DELETE.mockResolvedValue({
      error: undefined,
      response: {
        ok: true,
        status: 204,
      } as Response,
    });

    const result = await deleteComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
    });

    expect(mockClient.DELETE).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: "test-team", comment_id: 123 },
        },
      },
    );

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: true, message: "Comment deleted successfully" },
            null,
            2,
          ),
        },
      ],
    });
  });

  it("should handle API errors when deleting a comment", async () => {
    const mockError = {
      error: "forbidden",
      message: "Insufficient permissions",
    };

    mockClient.DELETE.mockResolvedValue({
      error: mockError,
      response: {
        ok: false,
        status: 403,
      } as Response,
    });

    const result = await deleteComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
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

  it("should handle network errors when deleting a comment", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.DELETE.mockRejectedValue(networkError);

    const result = await deleteComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
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

  it("should handle non-Error exceptions when deleting a comment", async () => {
    mockClient.DELETE.mockRejectedValue("Unexpected error");

    const result = await deleteComment(mockClient, {
      teamName: "test-team",
      commentId: 123,
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
    const result = await deleteComment(mockClient, {
      teamName: "",
      commentId: 123,
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
        },
      ],
    });

    expect(mockClient.DELETE).not.toHaveBeenCalled();
  });
});

describe("getPostComments", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get post comments successfully", async () => {
    const mockCommentList = createMockCommentList();

    mockClient.GET.mockResolvedValue({
      data: mockCommentList,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getPostComments(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}/comments",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
          query: { page: undefined, per_page: undefined },
        },
      },
    );

    const transformedComments = mockCommentList.comments.map((comment) =>
      createExpectedTransformedComment(comment),
    );

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { ...mockCommentList, comments: transformedComments },
            null,
            2,
          ),
        },
      ],
    });
  });

  it("should handle API errors when getting post comments", async () => {
    const mockError = { error: "not_found", message: "Post not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await getPostComments(mockClient, {
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

  it("should handle network errors when getting post comments", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getPostComments(mockClient, {
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

  it("should handle non-Error exceptions when getting post comments", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getPostComments(mockClient, {
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

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getPostComments(mockClient, {
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

describe("getTeamComments", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get team comments successfully", async () => {
    const mockCommentList = createMockCommentList();

    mockClient.GET.mockResolvedValue({
      data: mockCommentList,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getTeamComments(mockClient, {
      teamName: "test-team",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/comments",
      {
        params: {
          path: { team_name: "test-team" },
          query: { page: undefined, per_page: undefined },
        },
      },
    );

    const transformedComments = mockCommentList.comments.map((comment) =>
      createExpectedTransformedComment(comment),
    );

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { ...mockCommentList, comments: transformedComments },
            null,
            2,
          ),
        },
      ],
    });
  });

  it("should handle API errors when getting team comments", async () => {
    const mockError = { error: "forbidden", message: "Access denied" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 403,
      } as Response,
    });

    const result = await getTeamComments(mockClient, {
      teamName: "private-team",
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

  it("should handle network errors when getting team comments", async () => {
    const networkError = new Error("Network connection failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getTeamComments(mockClient, {
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

  it("should handle non-Error exceptions when getting team comments", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getTeamComments(mockClient, {
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
    const result = await getTeamComments(mockClient, {
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
