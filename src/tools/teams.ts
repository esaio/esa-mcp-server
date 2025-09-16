import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";

export const getTeamsSchema = z.object({
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
  role: z.enum(["member", "owner"]).optional().describe("Filter by role"),
});

export async function getTeams(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getTeamsSchema> = {},
) {
  try {
    const { data, error, response } = await client.GET("/v1/teams", {
      params: {
        query: {
          page: args.page,
          per_page: args.perPage,
          role: args.role,
        },
      },
    });

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const transformed = {
      ...data,
      teams: data.teams?.map((team: components["schemas"]["Team"]) => ({
        url: team.url,
        name: team.name,
        description: team.description,
      })),
    };

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const getTeamStatsSchema = createSchemaWithTeamName({});

export async function getTeamStats(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getTeamStatsSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      `/v1/teams/{team_name}/stats`,
      {
        params: {
          path: { team_name: args.teamName },
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

export const getTeamTagsSchema = createSchemaWithTeamName({
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
});

export async function getTeamTags(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getTeamTagsSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      `/v1/teams/{team_name}/tags`,
      {
        params: {
          path: { team_name: args.teamName },
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

    return formatToolResponse(data);
  } catch (error) {
    return formatToolError(error);
  }
}

export const getTeamMembersSchema = createSchemaWithTeamName({
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
  sort: z
    .enum(["posts_count", "joined", "last_accessed"])
    .optional()
    .describe("Sort criteria"),
  order: z.enum(["desc", "asc"]).optional().describe("Sort order"),
});

export async function getTeamMembers(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getTeamMembersSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      `/v1/teams/{team_name}/members`,
      {
        params: {
          path: { team_name: args.teamName },
          query: {
            page: args.page,
            per_page: args.perPage,
            sort: args.sort,
            order: args.order,
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
