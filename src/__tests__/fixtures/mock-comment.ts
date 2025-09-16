import type { components } from "../../generated/api-types.js";
import { transformComment } from "../../transformers/comment-transformer.js";

export function createMockComment(
  overrides?: Partial<components["schemas"]["Comment"]>,
): components["schemas"]["Comment"] {
  return {
    id: 123,
    post_number: 456,
    body_md: "This is a test comment content",
    body_html: "<p>This is a test comment content</p>",
    created_at: "2024-01-01T00:00:00+09:00",
    updated_at: "2024-01-01T01:00:00+09:00",
    url: "https://test-team.esa.example.com/posts/456#comment-123",
    created_by: {
      name: "Test User",
      screen_name: "testuser",
      icon: "https://example.com/icon.png",
      myself: true,
    },
    stargazers_count: 5,
    star: true,
    stargazers: [
      {
        created_at: "2024-01-01T02:00:00+09:00",
        body: "Great comment!",
        user: {
          name: "Stargazer User",
          screen_name: "stargazer",
          icon: "https://example.com/star-icon.png",
          myself: false,
        },
        name: "Stargazer User",
        screen_name: "stargazer",
        icon: "https://example.com/star-icon.png",
        myself: false,
        email: "stargazer@example.com",
        role: "member" as const,
        posts_count: 10,
        joined_at: "2024-01-01T00:00:00+09:00",
        last_accessed_at: "2024-01-01T02:00:00+09:00",
      },
    ],
    ...overrides,
  };
}

export function createLongContentComment(
  length: number,
): components["schemas"]["Comment"] {
  const longContent = "a".repeat(length);
  return createMockComment({
    body_md: longContent,
    body_html: `<p>${longContent}</p>`,
  });
}

export function createNullBodyComment(
  overrides?: Partial<components["schemas"]["Comment"]>,
): components["schemas"]["Comment"] {
  return createMockComment({
    body_md: "",
    body_html: "",
    ...overrides,
  });
}

export function createExpectedTransformedComment(
  comment: components["schemas"]["Comment"],
) {
  return transformComment(comment);
}

export function createMockCommentList(
  overrides?: Partial<components["schemas"]["CommentList"]>,
): components["schemas"]["CommentList"] {
  return {
    comments: [
      createMockComment({ id: 1, post_number: 123, body_md: "First comment" }),
      createMockComment({ id: 2, post_number: 124, body_md: "Second comment" }),
    ],
    prev_page: null,
    next_page: 2,
    total_count: 10,
    page: 1,
    per_page: 20,
    max_per_page: 100,
    ...overrides,
  };
}
