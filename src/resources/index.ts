import {
  type McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { withContext } from "../api_client/with-context.js";
import type { MCPContext } from "../context/mcp-context.js";

import { getRecentPosts } from "./recent-posts.js";
import { createRecentPostsResourceList } from "./recent-posts-list.js";

export function setupResources(server: McpServer, context: MCPContext): void {
  console.error("Setting up MCP resources...");

  server.registerResource(
    "esa_recent_posts",
    new ResourceTemplate("esa://teams/{teamName}/posts/recent", {
      list: async () => {
        const resources = await createRecentPostsResourceList(context);
        return { resources };
      },
    }),
    {
      title: "Recent Posts",
      description: "Fetch recent updated posts from esa team",
      mimeType: "application/json",
    },
    async (uri, params) =>
      withContext(context, getRecentPosts, { ...params, uri: uri.href } as {
        teamName: string;
        uri: string;
      }),
  );
}
