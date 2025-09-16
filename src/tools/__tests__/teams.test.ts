import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import {
  getTeamMembers,
  getTeamStats,
  getTeams,
  getTeamTags,
} from "../teams.js";

describe("getTeams", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return teams successfully", async () => {
    const mockTeams = [
      {
        name: "test-team",
        description: "Test team",
        url: "https://test-team.esa.example.com",
        privacy: "open",
        icon: "https://example.com/icon.png",
      },
    ];

    const mockResponse = {
      teams: mockTeams,
      page: 1,
      per_page: 20,
      total_count: 1,
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

    const result = await getTeams(mockClient);

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams", {
      params: {
        query: {
          page: undefined,
          per_page: undefined,
          role: undefined,
        },
      },
    });

    const expectedResponse = {
      teams: mockTeams.map((team) => ({
        url: team.url,
        name: team.name,
        description: team.description,
      })),
      page: 1,
      per_page: 20,
      total_count: 1,
      max_per_page: 100,
    };

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(expectedResponse, null, 2),
        },
      ],
    });
  });

  it("should return teams with query parameters", async () => {
    const args = { page: 2, perPage: 10, role: "owner" as const };

    mockClient.GET.mockResolvedValue({
      data: { teams: [] },
      error: undefined,
    });

    await getTeams(mockClient, args);

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams", {
      params: {
        query: {
          page: 2,
          per_page: 10,
          role: "owner",
        },
      },
    });
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

    const result = await getTeams(mockClient);

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

    const result = await getTeams(mockClient);

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

    const result = await getTeams(mockClient);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Unexpected error",
        },
      ],
    });
  });
});

describe("getTeamStats", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return team stats successfully", async () => {
    const mockStats = {
      members: 25,
      posts: 1234,
      posts_wip: 56,
      posts_shipped: 1178,
      comments: 2345,
      stars: 567,
      watches: 89,
      daily_active_users: 15,
      weekly_active_users: 20,
      monthly_active_users: 24,
    };

    mockClient.GET.mockResolvedValue({
      data: mockStats,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getTeamStats(mockClient, { teamName: "test-team" });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/stats", {
      params: {
        path: { team_name: "test-team" },
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(mockStats, null, 2),
        },
      ],
    });
  });

  it("should handle API errors", async () => {
    const mockError = { error: "not_found", message: "Team not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await getTeamStats(mockClient, { teamName: "test-team" });

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

    const result = await getTeamStats(mockClient, { teamName: "test-team" });

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

    const result = await getTeamStats(mockClient, { teamName: "test-team" });

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
    const result = await getTeamStats(mockClient, { teamName: "" });

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

describe("getTeamTags", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return team tags successfully", async () => {
    const mockTags = {
      tags: [
        { name: "design", posts_count: 42 },
        { name: "engineering", posts_count: 128 },
        { name: "meeting", posts_count: 35 },
      ],
      page: 1,
      per_page: 20,
      total_count: 3,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockTags,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getTeamTags(mockClient, { teamName: "test-team" });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/tags", {
      params: {
        path: { team_name: "test-team" },
        query: {
          page: undefined,
          perPage: undefined,
        },
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(mockTags, null, 2),
        },
      ],
    });
  });

  it("should handle pagination parameters", async () => {
    const mockTags = {
      tags: [],
      page: 2,
      per_page: 10,
      total_count: 50,
      max_per_page: 100,
    };

    mockClient.GET.mockResolvedValue({
      data: mockTags,
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getTeamTags(mockClient, {
      teamName: "test-team",
      page: 2,
      perPage: 10,
    });

    expect(mockClient.GET).toHaveBeenCalledWith("/v1/teams/{team_name}/tags", {
      params: {
        path: { team_name: "test-team" },
        query: {
          page: 2,
          per_page: 10,
        },
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(mockTags, null, 2),
        },
      ],
    });
  });

  it("should handle API errors", async () => {
    const mockError = { error: "not_found", message: "Team not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await getTeamTags(mockClient, { teamName: "test-team" });

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

    const result = await getTeamTags(mockClient, { teamName: "test-team" });

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

    const result = await getTeamTags(mockClient, { teamName: "test-team" });

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
    const result = await getTeamTags(mockClient, { teamName: "" });

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

describe("getTeamMembers", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return team members successfully", async () => {
    const mockMembers = {
      members: [
        { name: "John Doe", screen_name: "john", role: "owner" },
        { name: "Jane Smith", screen_name: "jane", role: "member" },
      ],
      total_count: 2,
    };

    mockClient.GET.mockResolvedValue({
      data: mockMembers,
      error: undefined,
      response: { ok: true } as Response,
    });

    const result = await getTeamMembers(mockClient, { teamName: "test-team" });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/members",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            page: undefined,
            per_page: undefined,
            sort: undefined,
            order: undefined,
          },
        },
      },
    );

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(mockMembers, null, 2) }],
    });
  });

  it("should handle pagination parameters", async () => {
    mockClient.GET.mockResolvedValue({
      data: {},
      error: undefined,
      response: { ok: true } as Response,
    });

    await getTeamMembers(mockClient, {
      teamName: "test-team",
      page: 2,
      perPage: 5,
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/members",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            page: 2,
            per_page: 5,
            sort: undefined,
            order: undefined,
          },
        },
      },
    );
  });

  it("should handle sort and order parameters", async () => {
    mockClient.GET.mockResolvedValue({
      data: {},
      error: undefined,
      response: { ok: true } as Response,
    });

    await getTeamMembers(mockClient, {
      teamName: "test-team",
      sort: "posts_count",
      order: "desc",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/members",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            page: undefined,
            per_page: undefined,
            sort: "posts_count",
            order: "desc",
          },
        },
      },
    );
  });

  it("should handle API errors", async () => {
    const mockError = { error: "not_found" };

    mockClient.GET.mockResolvedValue({
      error: mockError,
      response: { ok: false } as Response,
    });

    const result = await getTeamMembers(mockClient, { teamName: "test-team" });

    expect(result).toEqual({
      content: [
        { type: "text", text: `Error: ${JSON.stringify(mockError, null, 2)}` },
      ],
    });
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network failed");

    mockClient.GET.mockRejectedValue(networkError);

    const result = await getTeamMembers(mockClient, { teamName: "test-team" });

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: Network failed" }],
    });
  });

  it("should handle non-Error exceptions", async () => {
    mockClient.GET.mockRejectedValue("Unexpected error");

    const result = await getTeamMembers(mockClient, { teamName: "test-team" });

    expect(result).toEqual({
      content: [{ type: "text", text: "Error: Unexpected error" }],
    });
  });

  it("should throw MissingTeamNameError when teamName is empty", async () => {
    const result = await getTeamMembers(mockClient, { teamName: "" });

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
