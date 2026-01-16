import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";

export const getCategoriesSchema = createSchemaWithTeamName({
  prefix: z
    .string()
    .optional()
    .describe(
      "Filter paths starting with specified string (e.g., 'dev' finds 'dev', 'dev/api', 'dev/docs')",
    ),
  suffix: z
    .string()
    .optional()
    .describe(
      "Filter paths ending with specified string (e.g., 'api' finds 'dev/api', 'backend/api')",
    ),
  match: z
    .string()
    .optional()
    .describe(
      "Filter paths containing specified substring anywhere (e.g., 'doc' finds 'docs', 'dev/docs', 'documentation')",
    ),
  exactMatch: z
    .string()
    .optional()
    .describe(
      "Filter paths matching exactly (e.g., 'dev/api' matches only 'dev/api', ignores leading/trailing slashes)",
    ),
});

export async function getCategories(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getCategoriesSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/categories/paths",
      {
        params: {
          path: { team_name: args.teamName },
          query: {
            prefix: args.prefix,
            suffix: args.suffix,
            match: args.match,
            exact_match: args.exactMatch,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    return formatToolResponse(data);
  } catch (error) {
    return formatToolError(error);
  }
}
