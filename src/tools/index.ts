import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import { withContext } from "../api_client/with-context.js";
import type { MCPContext } from "../context/mcp-context.js";
import { getAttachment, getAttachmentSchema } from "./attachments.js";
import {
  getAllCategoryPaths,
  getAllCategoryPathsSchema,
  getCategories,
  getCategoriesSchema,
  getTopCategories,
  getTopCategoriesSchema,
} from "./categories.js";
import {
  createComment,
  createCommentSchema,
  deleteComment,
  deleteCommentSchema,
  getComment,
  getCommentSchema,
  getPostComments,
  getPostCommentsSchema,
  getTeamComments,
  getTeamCommentsSchema,
  updateComment,
  updateCommentSchema,
} from "./comments.js";
import {
  getMarkdownSyntaxHelp,
  getSearchOptionsHelp,
  searchHelp,
  searchHelpSchema,
} from "./helps.js";
import {
  archivePost,
  archivePostSchema,
  duplicatePost,
  duplicatePostSchema,
  shipPost,
  shipPostSchema,
} from "./post-actions.js";
import {
  createPost,
  createPostSchema,
  getPost,
  getPostSchema,
  updatePost,
  updatePostSchema,
} from "./posts.js";
import { searchPosts, searchPostsSchema } from "./search.js";
import {
  getTeamMembers,
  getTeamMembersSchema,
  getTeamStats,
  getTeamStatsSchema,
  getTeams,
  getTeamsSchema,
  getTeamTags,
  getTeamTagsSchema,
} from "./teams.js";

export function setupTools(server: McpServer, context: MCPContext): void {
  console.error("Setting up MCP tools...");

  server.registerTool(
    "esa_get_teams",
    {
      title: "Get user's accessible esa teams",
      description: "Retrieves a list of esa teams that the user has access to.",
      inputSchema: getTeamsSchema.shape,
    },
    async (params: z.infer<typeof getTeamsSchema>) =>
      withContext(context, getTeams, params),
  );

  server.registerTool(
    "esa_get_team_stats",
    {
      title: "Get team statistics",
      description:
        "Retrieves team statistics including member count, posts count (total/WIP/shipped), comments, stars, watches, and daily/weekly/monthly active users",
      inputSchema: getTeamStatsSchema.shape,
    },
    async (params: z.infer<typeof getTeamStatsSchema>) =>
      withContext(context, getTeamStats, params),
  );

  server.registerTool(
    "esa_get_team_tags",
    {
      title: "Get team tags",
      description:
        "Retrieves all tags used in posts within a team, along with the count of posts for each tag",
      inputSchema: getTeamTagsSchema.shape,
    },
    async (params: z.infer<typeof getTeamTagsSchema>) =>
      withContext(context, getTeamTags, params),
  );

  server.registerTool(
    "esa_get_team_members",
    {
      title: "Get team members",
      description:
        "Retrieves all members of a team with their roles and profile information",
      inputSchema: getTeamMembersSchema.shape,
    },
    async (params: z.infer<typeof getTeamMembersSchema>) =>
      withContext(context, getTeamMembers, params),
  );

  server.registerTool(
    "esa_get_post",
    {
      title: "Get a specific esa post",
      description:
        "Retrieves a specific post from an esa team by post number, with optional comments included.",
      inputSchema: getPostSchema.shape,
    },
    async (params: z.infer<typeof getPostSchema>) =>
      withContext(context, getPost, params),
  );

  server.registerTool(
    "esa_search_posts",
    {
      title: "Search Posts",
      description: "Search for posts in esa.io",
      inputSchema: searchPostsSchema.shape,
    },
    async (params: z.infer<typeof searchPostsSchema>) =>
      withContext(context, searchPosts, params),
  );

  server.registerTool(
    "esa_create_post",
    {
      title: "Create a new esa post",
      description:
        "Creates a new post in an esa team with optional tags, category, and WIP status.",
      inputSchema: createPostSchema.shape,
    },
    async (params: z.infer<typeof createPostSchema>) =>
      withContext(context, createPost, params),
  );

  server.registerTool(
    "esa_update_post",
    {
      title: "Update an existing esa post",
      description:
        "Updates an existing post in an esa team by post number. You can update the title, content, tags, category, and WIP status. To ship a post (mark as complete), set wip to false - this is preferred over using esa_ship_post when updating other fields simultaneously.",
      inputSchema: updatePostSchema.shape,
    },
    async (params: z.infer<typeof updatePostSchema>) =>
      withContext(context, updatePost, params),
  );

  server.registerTool(
    "esa_get_comment",
    {
      title: "Get a specific comment",
      description:
        "Retrieves a specific comment by comment ID, with optional stargazers included.",
      inputSchema: getCommentSchema.shape,
    },
    async (params: z.infer<typeof getCommentSchema>) =>
      withContext(context, getComment, params),
  );

  server.registerTool(
    "esa_create_comment",
    {
      title: "Create a new comment on a post",
      description: "Creates a new comment on an existing post in an esa team.",
      inputSchema: createCommentSchema.shape,
    },
    async (params: z.infer<typeof createCommentSchema>) =>
      withContext(context, createComment, params),
  );

  server.registerTool(
    "esa_update_comment",
    {
      title: "Update an existing comment",
      description: "Updates an existing comment in an esa team by comment ID.",
      inputSchema: updateCommentSchema.shape,
    },
    async (params: z.infer<typeof updateCommentSchema>) =>
      withContext(context, updateComment, params),
  );

  server.registerTool(
    "esa_delete_comment",
    {
      title: "Delete a comment",
      description: "Deletes a comment from an esa team by comment ID.",
      inputSchema: deleteCommentSchema.shape,
    },
    async (params: z.infer<typeof deleteCommentSchema>) =>
      withContext(context, deleteComment, params),
  );

  server.registerTool(
    "esa_get_post_comments",
    {
      title: "Get comments for a specific post",
      description:
        "Retrieves a list of comments for a specific post with pagination support.",
      inputSchema: getPostCommentsSchema.shape,
    },
    async (params: z.infer<typeof getPostCommentsSchema>) =>
      withContext(context, getPostComments, params),
  );

  server.registerTool(
    "esa_get_team_comments",
    {
      title: "Get team comments",
      description:
        "Retrieves a list of comments in a team with pagination support.",
      inputSchema: getTeamCommentsSchema.shape,
    },
    async (params: z.infer<typeof getTeamCommentsSchema>) =>
      withContext(context, getTeamComments, params),
  );

  server.registerTool(
    "esa_get_categories",
    {
      title: "Get categories for a specific path",
      description:
        "Retrieves category information and subcategories for a specific category path, with optional posts and parent categories included",
      inputSchema: getCategoriesSchema.shape,
    },
    async (params: z.infer<typeof getCategoriesSchema>) =>
      withContext(context, getCategories, params),
  );

  server.registerTool(
    "esa_get_top_categories",
    {
      title: "Get top-level categories",
      description: "Retrieves all top-level categories for a team",
      inputSchema: getTopCategoriesSchema.shape,
    },
    async (params: z.infer<typeof getTopCategoriesSchema>) =>
      withContext(context, getTopCategories, params),
  );

  server.registerTool(
    "esa_get_all_category_paths",
    {
      title: "Get all category paths for organization and structure review",
      description:
        "Retrieves all category paths in a team at once to understand the overall category structure. Perfect for category organization, cleanup, migration planning, or finding similar categories. Returns a simple list of paths with post counts, sorted in lexicographic order. Supports filtering (prefix/suffix/match/exact_match) to find categories by pattern. No pagination - gets all categories in one call.",
      inputSchema: getAllCategoryPathsSchema.shape,
    },
    async (params: z.infer<typeof getAllCategoryPathsSchema>) =>
      withContext(context, getAllCategoryPaths, params),
  );

  server.registerTool(
    "esa_archive_post",
    {
      title: "Archive a post",
      description:
        "Archives a post by moving it to the Archived/ category. If the post is in 'dev/docs', it becomes 'Archived/dev/docs'. Posts without category go to 'Archived'.",
      inputSchema: archivePostSchema.shape,
    },
    async (params: z.infer<typeof archivePostSchema>) =>
      withContext(context, archivePost, params),
  );

  server.registerTool(
    "esa_ship_post",
    {
      title: "Ship a post",
      description:
        "Ships a post by setting wip to false. This marks the post as complete and ready to be published. Use this only when you need to ship without making other changes - if you're also updating title, content, or other fields, use esa_update_post with wip: false instead.",
      inputSchema: shipPostSchema.shape,
    },
    async (params: z.infer<typeof shipPostSchema>) =>
      withContext(context, shipPost, params),
  );

  server.registerTool(
    "esa_duplicate_post",
    {
      title: "Prepare a post for duplication",
      description:
        "Prepares a post for duplication by retrieving its name and body_md content. Returns the name and body_md that can be used with esa_create_post to create a duplicate of the original post.",
      inputSchema: duplicatePostSchema.shape,
    },
    async (params: z.infer<typeof duplicatePostSchema>) =>
      withContext(context, duplicatePost, params),
  );

  server.registerTool(
    "esa_get_search_options_help",
    {
      title: "Get esa search options documentation",
      description: `Get esa search syntax documentation when you need to construct complex
search queries. Use this BEFORE esa_search_posts if you're unsure how to
translate user's search requirements into proper esa query syntax (e.g., date
ranges, tag filters, category searches, advanced operators).`,
      inputSchema: {},
    },
    async (params: Record<string, never>) =>
      withContext(context, getSearchOptionsHelp, params),
  );

  server.registerTool(
    "esa_get_markdown_syntax_help",
    {
      title: "Get esa Markdown syntax documentation",
      description: `Get esa Markdown and formatting documentation when unsure about syntax.
Use this BEFORE using any tools with *_md parameters (like esa_create_post,
esa_update_post, esa_create_comment, esa_update_comment) if you need
clarification on Markdown syntax, esa-specific extensions, or formatting options.`,
      inputSchema: {},
    },
    async (params: Record<string, never>) =>
      withContext(context, getMarkdownSyntaxHelp, params),
  );

  server.registerTool(
    "esa_search_help",
    {
      title: "Search esa documentation and help",
      description: `Search esa documentation for features, terminology, and specifications.
Use this when users mention esa-specific terms, ask about esa functionality,
or request help with esa workflows that you're not familiar with.`,
      inputSchema: searchHelpSchema.shape,
    },
    async (params: z.infer<typeof searchHelpSchema>) =>
      withContext(context, searchHelp, params),
  );

  server.registerTool(
    "esa_get_attachment",
    {
      title: "Get attachment file from esa",
      description:
        "Retrieves an attachment file from esa with signed URLs. For supported images (JPEG, PNG, GIF, WebP) under 30MB, returns base64-encoded data. For other file types, larger images, or when forceSignedUrl is true, returns signed URLs.",
      inputSchema: getAttachmentSchema.shape,
    },
    async (params: z.infer<typeof getAttachmentSchema>) =>
      withContext(context, getAttachment, params),
  );
}
