import type { createEsaClient } from "../api_client/index.js";
import {
  formatResourceError,
  formatResourceResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { transformPost } from "../transformers/post-transformer.js";

const RECENT_POSTS_QUERY = {
  sort: "updated",
  order: "desc",
} as const;

export async function getRecentPosts(
  client: ReturnType<typeof createEsaClient>,
  args: { teamName: string; uri: string },
) {
  const { teamName, uri } = args;
  try {
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: teamName },
          query: RECENT_POSTS_QUERY,
        },
      },
    );

    if (error || !response.ok) {
      return formatResourceError(error || response.status, uri);
    }

    const transformed = {
      ...data,
      posts: data.posts?.map((post: components["schemas"]["Post"]) =>
        transformPost(post, { truncateBody: 500 }),
      ),
    };

    return formatResourceResponse(transformed, uri);
  } catch (error) {
    return formatResourceError(error, uri);
  }
}
