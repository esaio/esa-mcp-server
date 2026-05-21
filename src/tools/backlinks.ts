import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";
import { transformPostSummary } from "../transformers/post-summary-transformer.js";

export const getPostBacklinksSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to get backlinks for"),
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
});

export async function getPostBacklinks(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getPostBacklinksSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts/{post_number}/backlinks",
      {
        params: {
          path: { team_name: args.teamName, post_number: args.postNumber },
          query: {
            page: args.page,
            per_page: args.perPage,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const posts: components["schemas"]["PostSummary"][] = data.posts;
    const transformed = posts.map(transformPostSummary);

    return formatToolResponse({ ...data, posts: transformed });
  } catch (error) {
    return formatToolError(error);
  }
}
