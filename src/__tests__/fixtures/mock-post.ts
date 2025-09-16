import type { components } from "../../generated/api-types.js";
import {
  type PostTransformOptions,
  transformPost,
} from "../../transformers/post-transformer.js";

export const createMockPost = (
  overrides: Partial<components["schemas"]["Post"]> = {},
): components["schemas"]["Post"] => ({
  number: 123,
  name: "test-post.md",
  tags: ["tag1", "tag2"],
  category: "dev",
  full_name: "dev/test-post.md #tag1 #tag2",
  wip: false,
  body_md: "# Test Post\n\nThis is a test post content.",
  body_html: "<h1>Test Post</h1><p>This is a test post content.</p>",
  created_at: "2024-01-01T00:00:00+09:00",
  updated_at: "2024-01-02T00:00:00+09:00",
  message: "Update test post",
  url: "https://test-team.esa.example.com/posts/123",
  revision_number: 3,
  created_by: {
    name: "user1",
    screen_name: "user1",
    icon: "https://example.com/icon1.png",
    myself: false,
  },
  updated_by: {
    name: "user2",
    screen_name: "user2",
    icon: "https://example.com/icon2.png",
    myself: false,
  },
  kind: "stock",
  comments_count: 5,
  tasks_count: 3,
  done_tasks_count: 2,
  stargazers_count: 10,
  watchers_count: 8,
  star: true,
  watch: false,
  ...overrides,
});

export const createWipPost = (
  overrides: Partial<components["schemas"]["Post"]> = {},
): components["schemas"]["Post"] =>
  createMockPost({
    wip: true,
    number: 456,
    name: "wip-post.md",
    full_name: "docs/wip-post.md #wip",
    url: "https://test-team.esa.example.com/posts/456",
    kind: "flow",
    ...overrides,
  });

export const createLongContentPost = (
  contentLength = 600,
): components["schemas"]["Post"] =>
  createMockPost({
    body_md: "a".repeat(contentLength),
    body_html: `<p>${"a".repeat(contentLength)}</p>`,
  });

export const createNullBodyPost = (
  overrides: Partial<components["schemas"]["Post"]> = {},
): components["schemas"]["Post"] =>
  createMockPost({
    body_md: undefined,
    body_html: undefined,
    ...overrides,
  });

export const createExpectedTransformed = (
  post: components["schemas"]["Post"],
  options: PostTransformOptions = {},
) => transformPost(post, options);
