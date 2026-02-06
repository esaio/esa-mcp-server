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
import { normalizeSearchQuery } from "../transformers/query-normalizer.js";

export const searchPostsSchema = createSchemaWithTeamName({
  query: z
    .string()
    .describe(`Search query string. Use specific terms, not wildcards like "*". Empty string returns all posts.
## Important Note for Date Queries:
**WARNING: Do NOT use 'after:', 'before:', 'since:', or 'until:' syntax (these are from GitHub/Gmail/pplog).
Use esa-specific date syntax: created:>YYYY-MM-DD, created:<YYYY-MM-DD, updated:>YYYY-MM-DD, updated:<YYYY-MM-DD

## Important Note for Relative Date Queries:
**CRITICAL: Always get today's actual date from the system before processing
relative date queries (e.g., "today", "yesterday", "last week", "recent").
When searching, apply these strategies:
1. Convert concepts to technical terms (e.g., general descriptions → specific property names, method names, or technical keywords)
2. Translate between Japanese and English technical terms (e.g., Japanese concepts → English API/property names)
3. Expand to related technical elements (e.g., one concept → multiple implementation approaches, related technologies, or alternative solutions)
IMPORTANT: Space-separated terms are treated as AND conditions. Use "OR" operator for alternative terms: "word-break OR word-wrap OR overflow-wrap".
Advanced search: "tag:release", "category:dev", "wip:false", "keyword:API", "title:設計書".
Category search: "on:category" (posts directly in category), "in:category" (posts in category and subcategories), "on:/" (uncategorized posts).
For broader results, use OR between related terms rather than listing them with spaces.`)
    .transform(normalizeSearchQuery),
  sort: z
    .enum([
      "updated",
      "created",
      "number",
      "stars",
      "watches",
      "comments",
      "best_match",
    ])
    .optional()
    .describe("Sort key"),
  order: z.enum(["desc", "asc"]).optional().describe("Sort direction"),
  page: z.number().int().positive().optional().describe("Page number"),
  perPage: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Items per page"),
  include: z
    .enum(["comments"])
    .optional()
    .describe("Specify 'comments' to include comments in the response"),
});

export async function searchPosts(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof searchPostsSchema>,
) {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }

    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts",
      {
        params: {
          path: { team_name: args.teamName },
          query: {
            q: args.query,
            sort: args.sort,
            order: args.order,
            page: args.page,
            per_page: args.perPage,
            include: args.include,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }
    const posts: components["schemas"]["Post"][] = data.posts;
    const transformed = posts.map((post) =>
      transformPost(post, { truncateBody: 500 }),
    );

    if (posts.length === 0 && isAndQuery(args.query)) {
      return {
        content: [
          {
            type: "text" as const,
            text: generateOrSearchSuggestion(args.query),
          },
        ],
      };
    }

    return formatToolResponse(transformed);
  } catch (error) {
    return formatToolError(error);
  }
}

function isAndQuery(query: string): boolean {
  if (!query || query.trim() === "") {
    return false;
  }

  if (/\bOR\b/.test(query) || query.includes("|")) {
    return false;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.length >= 2;
}

function generateOrSearchSuggestion(query: string): string {
  const tokens = query.split(/\s+/).filter(Boolean);
  const orQuery = tokens.join(" OR ");
  return `---
No results found. Your query uses AND conditions (space-separated terms).
Suggestions:
- Try OR search: "${orQuery}"
- Omit some keywords from your query`;
}
