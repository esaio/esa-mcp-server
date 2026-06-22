import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";
import { transformPost } from "../transformers/post-transformer.js";
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
  postNumber: z.number().describe("The source post number to duplicate"),
  targetTeamName: z
    .string()
    .optional()
    .describe(
      "The destination team name for the duplicated post. Defaults to the source team when omitted.",
    )
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

const insertContentShape = {
  postNumber: z.number().describe("The post number to add content to"),
  content: z
    .string()
    .describe(
      "The Markdown content to insert. Use 4 spaces for indentation. Line endings are normalized to LF.",
    ),
  wip: z
    .boolean()
    .optional()
    .describe(
      "WIP state after the insert. Defaults to the post's current WIP state",
    ),
  message: z
    .string()
    .optional()
    .describe('Change message. Defaults to "Updated via API." when omitted'),
};

export const appendPostSchema = createSchemaWithTeamName(insertContentShape);

export async function appendPost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof appendPostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.POST(
      "/v1/teams/{team_name}/posts/{post_number}/append",
      {
        params: {
          path: { team_name: args.teamName, post_number: args.postNumber },
        },
        body: {
          post: {
            content: args.content,
            wip: args.wip,
            message: args.message,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;
    const transformed = transformPost(post, { omitBody: true });

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const prependPostSchema = createSchemaWithTeamName(insertContentShape);

export async function prependPost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof prependPostSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.POST(
      "/v1/teams/{team_name}/posts/{post_number}/prepend",
      {
        params: {
          path: { team_name: args.teamName, post_number: args.postNumber },
        },
        body: {
          post: {
            content: args.content,
            wip: args.wip,
            message: args.message,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;
    const transformed = transformPost(post, { omitBody: true });

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const rollbackPostRevisionSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to roll back"),
  revisionNumber: z
    .number()
    .describe(
      "The revision number to roll back to, e.g. the revision_number from esa_get_post before your edits",
    ),
  wip: z
    .boolean()
    .optional()
    .describe(
      "WIP state after rollback. Defaults to the target revision's WIP state",
    ),
  message: z.string().optional().describe("Change message for the rollback"),
});

export async function rollbackPostRevision(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof rollbackPostRevisionSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.POST(
      "/v1/teams/{team_name}/posts/{post_number}/revisions/{revision_number}/rollback",
      {
        params: {
          path: {
            team_name: args.teamName,
            post_number: args.postNumber,
            revision_number: args.revisionNumber,
          },
        },
        body: {
          post: {
            wip: args.wip,
            message: args.message,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;
    const transformed = transformPost(post, { omitBody: true });

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}
