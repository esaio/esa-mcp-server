import type { components } from "../generated/api-types.js";

export interface CommentTransformOptions {
  truncateBody?: number;
}

export function transformComment(
  comment: components["schemas"]["Comment"],
  options: CommentTransformOptions = {},
) {
  const { truncateBody } = options;

  let bodyMd = comment.body_md;
  if (truncateBody && bodyMd && bodyMd.length > truncateBody) {
    bodyMd = `${bodyMd.slice(0, truncateBody)}...`;
  }

  return {
    id: comment.id,
    post_number: comment.post_number,
    url: comment.url,
    body_md: bodyMd,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    created_by: comment.created_by,
    stats: {
      stargazers_count: comment.stargazers_count,
      star: comment.star,
    },
    stargazers: comment.stargazers,
  };
}

export type TransformedComment = ReturnType<typeof transformComment>;
