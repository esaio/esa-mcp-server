import type { components } from "../../generated/api-types.js";
import { transformPostSummary } from "../../transformers/post-summary-transformer.js";

export function createMockPostSummary(
  overrides?: Partial<components["schemas"]["PostSummary"]>,
): components["schemas"]["PostSummary"] {
  return {
    number: 42,
    name: "linked-post.md",
    full_name: "dev/linked-post.md #linked",
    wip: false,
    tags: ["linked"],
    category: "dev",
    url: "https://test-team.esa.example.com/posts/42",
    created_at: "2024-02-01T00:00:00+09:00",
    updated_at: "2024-02-02T00:00:00+09:00",
    ...overrides,
  };
}

export function createMockBacklinkList(
  overrides?: Partial<components["schemas"]["BacklinkList"]>,
): components["schemas"]["BacklinkList"] {
  return {
    posts: [
      createMockPostSummary({ number: 42, name: "linked-1.md" }),
      createMockPostSummary({ number: 43, name: "linked-2.md" }),
    ],
    prev_page: null,
    next_page: null,
    total_count: 2,
    page: 1,
    per_page: 20,
    max_per_page: 100,
    ...overrides,
  };
}

export function createExpectedTransformedPostSummary(
  post: components["schemas"]["PostSummary"],
) {
  return transformPostSummary(post);
}
