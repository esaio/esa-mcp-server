import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";
import { transformCategoryList } from "../transformers/category-transformer.js";

export const getCategoriesSchema = createSchemaWithTeamName({
  select: z.string().describe("Category path to retrieve"),
  include: z
    .enum(["posts", "parent_categories"])
    .optional()
    .describe("Additional information to include"),
  descendantPosts: z
    .boolean()
    .optional()
    .describe("Include descendant posts (only effective with include=posts)"),
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
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
      "/v1/teams/{team_name}/categories",
      {
        params: {
          path: { team_name: args.teamName },
          query: {
            select: args.select,
            include: args.include,
            descendant_posts: args.descendantPosts,
            page: args.page,
            per_page: args.perPage,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const categoryList: components["schemas"]["CategoryList"] = data;
    const transformed = transformCategoryList(categoryList);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const getTopCategoriesSchema = createSchemaWithTeamName({});

export async function getTopCategories(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getTopCategoriesSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/categories/top",
      {
        params: {
          path: { team_name: args.teamName },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const categoryList: components["schemas"]["CategoryList"] = data;
    const transformed = transformCategoryList(categoryList);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}
