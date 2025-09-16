import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";
import { normalizePostName } from "../transformers/post-name-normalizer.js";
import { transformPost } from "../transformers/post-transformer.js";

export const getPostSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to retrieve"),
  include: z
    .enum(["comments"])
    .optional()
    .describe("Specify 'comments' to include comments in the response"),
});

export async function getPost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getPostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: args.teamName, post_number: args.postNumber },
          query: {
            include: args.include,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }
    const post: components["schemas"]["Post"] = data;
    const transformed = transformPost(post);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const createPostSchema = createSchemaWithTeamName({
  name: z.string().describe("The post name (title)"),
  bodyMd: z.string().optional().describe("The post content in Markdown format"),
  tags: z.array(z.string()).optional().describe("Tags for the post"),
  category: z.string().optional().describe("Category path (e.g., 'dev/docs')"),
  wip: z
    .boolean()
    .default(true)
    .describe(
      "Whether the post is Work In Progress. Set to false to ship it (mark as complete and ready to be published)",
    ),
  message: z.string().optional().describe("Update message for the post"),
});

export async function createPost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof createPostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { name, category } = normalizePostName(args.name, args.category);

    const { data, error, response } = await client.POST(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: args.teamName },
        },
        body: {
          post: {
            name: name,
            body_md: args.bodyMd,
            tags: args.tags,
            category: category,
            wip: args.wip,
            message: args.message,
          } as components["schemas"]["PostCreateInput"],
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;
    const transformed = transformPost(post);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const updatePostSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to update"),
  name: z.string().optional().describe("The post name (title)"),
  bodyMd: z.string().optional().describe("The post content in Markdown format"),
  tags: z.array(z.string()).optional().describe("Tags for the post"),
  category: z.string().optional().describe("Category path (e.g., 'dev/docs')"),
  wip: z
    .boolean()
    .optional()
    .describe(
      "Whether the post is Work In Progress. Set to false to ship it (mark as complete and ready to be published)",
    ),
  message: z.string().optional().describe("Update message for the post"),
  originalRevision: z
    .object({
      bodyMd: z.string(),
      number: z.number(),
      user: z.string(),
    })
    .optional()
    .describe("Original revision to check for conflicts"),
});

export async function updatePost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof updatePostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { name, category } = normalizePostName(args.name, args.category);

    const { data, error, response } = await client.PATCH(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: args.teamName, post_number: args.postNumber },
        },
        body: {
          post: {
            name: name,
            body_md: args.bodyMd,
            tags: args.tags,
            category: category,
            wip: args.wip,
            message: args.message,
            original_revision: args.originalRevision
              ? {
                  body_md: args.originalRevision.bodyMd,
                  number: args.originalRevision.number,
                  user: args.originalRevision.user,
                }
              : undefined,
          } as components["schemas"]["PostUpdateInput"],
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;
    const transformed = transformPost(post);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}
