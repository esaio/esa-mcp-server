import type { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { getPost } from "./posts.js";
import { searchPosts, searchPostsSchema } from "./search.js";

// Documentation team and post constants
export const HELP_DOCS = {
  TEAM: "docs",
  SEARCH_OPTIONS_POST_ID: 104,
  MARKDOWN_SYNTAX_POST_ID: 49,
} as const;

// Schema for searchHelp - omit teamName, order, include, and sort from searchPostsSchema
export const searchHelpSchema = searchPostsSchema.omit({
  teamName: true,
  order: true,
  include: true,
  sort: true,
});

export async function getSearchOptionsHelp(
  client: ReturnType<typeof createEsaClient>,
  _args: Record<string, never>,
) {
  return getPost(client, {
    teamName: HELP_DOCS.TEAM,
    postNumber: HELP_DOCS.SEARCH_OPTIONS_POST_ID,
  });
}

export async function getMarkdownSyntaxHelp(
  client: ReturnType<typeof createEsaClient>,
  _args: Record<string, never>,
) {
  return getPost(client, {
    teamName: HELP_DOCS.TEAM,
    postNumber: HELP_DOCS.MARKDOWN_SYNTAX_POST_ID,
  });
}

export async function searchHelp(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof searchHelpSchema>,
) {
  return searchPosts(client, {
    teamName: HELP_DOCS.TEAM,
    sort: "best_match",
    ...args,
  });
}
