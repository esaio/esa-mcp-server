import type { components } from "../generated/api-types.js";

export function transformPostSummary(
  post: components["schemas"]["PostSummary"],
) {
  return {
    number: post.number,
    url: post.url,
    category_and_title_and_tags: post.full_name,
    wip: post.wip ? "WIP" : ("Shipped" as const),
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

export type TransformedPostSummary = ReturnType<typeof transformPostSummary>;
