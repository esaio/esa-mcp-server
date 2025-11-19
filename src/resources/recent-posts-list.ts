import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { withContext } from "../api_client/with-context.js";
import type { MCPContext } from "../context/mcp-context.js";
import { getTeams } from "../tools/teams.js";

export async function createRecentPostsResourceList(context: MCPContext) {
  try {
    const result = await withContext(context, getTeams, {});
    const data = JSON.parse((result.content[0] as TextContent).text);

    return (
      data.teams?.map((team: { name: string; description: string }) => ({
        uri: `esa://teams/${team.name}/posts/recent`,
        name: `Recent posts from ${team.name}`,
        description: `Recent posts from ${team.name}${team.description ? ` (${team.description})` : ""}`,
        mimeType: "application/json",
      })) || []
    );
  } catch (error) {
    console.error("Failed to list teams:", error);
    return [];
  }
}
