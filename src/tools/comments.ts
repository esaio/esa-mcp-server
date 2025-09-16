import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatToolError,
  formatToolResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";
import { transformComment } from "../transformers/comment-transformer.js";

export const getCommentSchema = createSchemaWithTeamName({
  commentId: z.number().describe("The comment ID to retrieve"),
  include: z
    .enum(["stargazers"])
    .optional()
    .describe("Specify 'stargazers' to include stargazers in the response"),
});

export async function getComment(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getCommentSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: args.teamName, comment_id: args.commentId },
          query: {
            include: args.include,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const comment: components["schemas"]["Comment"] = data;
    const transformed = transformComment(comment);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const createCommentSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to comment on"),
  bodyMd: z.string().describe("The comment content in Markdown format"),
  user: z
    .string()
    .optional()
    .describe("Comment author's screen_name (owner permission required)"),
});

export async function createComment(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof createCommentSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.POST(
      "/v1/teams/{team_name}/posts/{post_number}/comments",
      {
        params: {
          path: { team_name: args.teamName, post_number: args.postNumber },
        },
        body: {
          comment: {
            body_md: args.bodyMd,
            user: args.user,
          } as components["schemas"]["CommentInput"],
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const comment: components["schemas"]["Comment"] = data;
    const transformed = transformComment(comment, { truncateBody: 300 });

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const updateCommentSchema = createSchemaWithTeamName({
  commentId: z.number().describe("The comment ID to update"),
  bodyMd: z.string().describe("The updated comment content in Markdown format"),
  user: z
    .string()
    .optional()
    .describe("Comment author's screen_name (owner permission required)"),
});

export async function updateComment(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof updateCommentSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.PATCH(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: args.teamName, comment_id: args.commentId },
        },
        body: {
          comment: {
            body_md: args.bodyMd,
            user: args.user,
          } as components["schemas"]["CommentInput"],
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    const comment: components["schemas"]["Comment"] = data;
    const transformed = transformComment(comment);

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

export const deleteCommentSchema = createSchemaWithTeamName({
  commentId: z.number().describe("The comment ID to delete"),
});

export async function deleteComment(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof deleteCommentSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { error, response } = await client.DELETE(
      "/v1/teams/{team_name}/comments/{comment_id}",
      {
        params: {
          path: { team_name: args.teamName, comment_id: args.commentId },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    return formatToolResponse({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return formatToolError(error);
  }
}

export const getPostCommentsSchema = createSchemaWithTeamName({
  postNumber: z.number().describe("The post number to get comments for"),
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
});

export async function getPostComments(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getPostCommentsSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts/{post_number}/comments",
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

    const comments: components["schemas"]["Comment"][] = data.comments;
    const transformed = comments.map((comment) =>
      transformComment(comment, { truncateBody: 300 }),
    );

    return formatToolResponse({ ...data, comments: transformed });
  } catch (error) {
    return formatToolError(error);
  }
}

export const getTeamCommentsSchema = createSchemaWithTeamName({
  page: z.number().optional().describe("Page number (starts from 1)"),
  perPage: z.number().optional().describe("Number of items per page"),
});

export async function getTeamComments(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getTeamCommentsSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/comments",
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

    const comments: components["schemas"]["Comment"][] = data.comments;
    const transformed = comments.map((comment) =>
      transformComment(comment, { truncateBody: 300 }),
    );

    return formatToolResponse({ ...data, comments: transformed });
  } catch (error) {
    return formatToolError(error);
  }
}
