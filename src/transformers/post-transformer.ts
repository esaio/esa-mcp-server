import type { components } from "../generated/api-types.js";
import {
  type BodyTransformOptions,
  processBodyMd,
} from "./body-transformer.js";

export type PostTransformOptions = BodyTransformOptions;

export function transformPost(
  post: components["schemas"]["Post"],
  options: PostTransformOptions = {},
) {
  const bodyMd = processBodyMd(post.body_md, options);

  return {
    url: post.url,
    wip: post.wip ? "WIP" : ("Shipped" as const),
    kind: post.kind,
    category_and_title_and_tags: post.full_name,
    ...(bodyMd !== undefined && { body_md: bodyMd }),
    created_at: post.created_at,
    updated_at: post.updated_at,
    created_by: post.created_by,
    updated_by: post.updated_by,
    stats: {
      tasks_count: post.tasks_count,
      done_tasks_count: post.done_tasks_count,
      comments_count: post.comments_count,
      stargazers_count: post.stargazers_count,
      watchers_count: post.watchers_count,
    },
  };
}

export type TransformedPost = ReturnType<typeof transformPost>;
