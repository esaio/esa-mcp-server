import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpectedTransformedPostSummary,
  createMockBacklinkList,
} from "../../__tests__/fixtures/mock-backlink.js";
import type { createEsaClient } from "../../api_client/index.js";
import { getPostBacklinks } from "../backlinks.js";

describe("getPostBacklinks", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get post backlinks successfully", async () => {
    const mockList = createMockBacklinkList();

    mockClient.GET.mockResolvedValue({
      data: mockList,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getPostBacklinks(mockClient, {
      teamName: "test-team",
      postNumber: 123,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}/backlinks",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
          query: { page: undefined, per_page: undefined },
        },
      },
    );

    const transformedPosts = mockList.posts.map((post) =>
      createExpectedTransformedPostSummary(post),
    );

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { ...mockList, posts: transformedPosts },
            null,
            2,
          ),
        },
      ],
    });
  });

  it("should forward pagination parameters", async () => {
    const mockList = createMockBacklinkList();

    mockClient.GET.mockResolvedValue({
      data: mockList,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    await getPostBacklinks(mockClient, {
      teamName: "test-team",
      postNumber: 123,
      page: 2,
      perPage: 50,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/posts/{post_number}/backlinks",
      {
        params: {
          path: { team_name: "test-team", post_number: 123 },
          query: { page: 2, per_page: 50 },
        },
      },
    );
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

    const result = await getPostBacklinks(mockClient, {
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

    const result = await getPostBacklinks(mockClient, {
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

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getPostBacklinks(mockClient, {
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
