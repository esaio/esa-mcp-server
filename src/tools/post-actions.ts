import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";
import { normalizeTeamName } from "../transformers/team-name-normalizer.js";
import { createPost, updatePost } from "./posts.js";

export const archivePostSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to archive"),
  message: z.string().optional().describe("Archive message for the post"),
});

export async function archivePost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof archivePostSchema>,
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
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;
    const currentCategory = post.category || "";

    if (currentCategory.startsWith("Archived/")) {
      return formatToolResponse({
        message: "Post is already archived",
        category: currentCategory,
      });
    }

    const archivedCategory =
      currentCategory === "" ? "Archived" : `Archived/${currentCategory}`;

    return await updatePost(client, {
      teamName: args.teamName,
      postNumber: args.postNumber,
      category: archivedCategory,
      message: args.message || "Archive post",
    });
  } catch (error) {
    return formatToolError(error);
  }
}

export const shipPostSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to ship"),
});

export async function shipPost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof shipPostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    return await updatePost(client, {
      teamName: args.teamName,
      postNumber: args.postNumber,
      wip: false,
      message: "Ship It!",
    });
  } catch (error) {
    return formatToolError(error);
  }
}

export const duplicatePostSchema = createSchemaWithTeamName({
  postNumber: z
    .number()
    .describe("The source post number to prepare for duplication"),
  targetTeamName: z
    .string()
    .optional()
    .describe("The name of the esa team")
    .transform((val) => (val ? normalizeTeamName(val) : undefined)),
});

export async function duplicatePost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof duplicatePostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts/new",
      {
        params: {
          path: { team_name: args.teamName },
          query: {
            parent_post_id: args.postNumber,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const postNew = data.post as components["schemas"]["PostNew"];

    return createPost(client, {
      teamName: args.targetTeamName || args.teamName,
      name: postNew.name,
      bodyMd: postNew.body_md,
      wip: true,
    });
  } catch (error) {
    return formatToolError(error);
  }
}
