import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withContext } from "../../api_client/with-context.js";
import type { MCPContext } from "../../context/mcp-context.js";
import { getTeams } from "../../tools/teams.js";
import { createRecentPostsResourceList } from "../recent-posts-list.js";

vi.mock("../../api_client/with-context.js");
vi.mock("../../tools/teams.js");

describe("createRecentPostsResourceList", () => {
  let context: MCPContext;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    context = {} as unknown as MCPContext;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return team resources when teams are available", async () => {
    const mockTeams = {
      teams: [
        { name: "team1", description: "Team One" },
        { name: "team2", description: "" },
      ],
    };

    vi.mocked(withContext).mockResolvedValue({
      content: [{ text: JSON.stringify(mockTeams) }],
    } as unknown as Awaited<ReturnType<typeof withContext>>);

    const result = await createRecentPostsResourceList(context);

    expect(withContext).toHaveBeenCalledWith(context, getTeams, {});
    expect(result).toEqual([
      {
        uri: "esa://teams/team1/posts/recent",
        name: "Recent posts from team1",
        description: "Recent posts from team1 (Team One)",
        mimeType: "application/json",
      },
      {
        uri: "esa://teams/team2/posts/recent",
        name: "Recent posts from team2",
        description: "Recent posts from team2",
        mimeType: "application/json",
      },
    ]);
  });

  it("should return empty array when no teams available", async () => {
    vi.mocked(withContext).mockResolvedValue({
      content: [{ text: JSON.stringify({ teams: null }) }],
    } as unknown as Awaited<ReturnType<typeof withContext>>);

    const result = await createRecentPostsResourceList(context);

    expect(result).toEqual([]);
  });

  it("should return empty array and log error when withContext fails", async () => {
    const error = new Error("API Error");
    vi.mocked(withContext).mockRejectedValue(error);

    const result = await createRecentPostsResourceList(context);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to list teams:",
      error,
    );
  });

  it("should return empty array when JSON parsing fails", async () => {
    vi.mocked(withContext).mockResolvedValue({
      content: [{ text: "invalid json" }],
    } as unknown as Awaited<ReturnType<typeof withContext>>);

    const result = await createRecentPostsResourceList(context);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to list teams:",
      expect.any(SyntaxError),
    );
  });
});
