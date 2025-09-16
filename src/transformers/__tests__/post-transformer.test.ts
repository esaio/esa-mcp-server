import { describe, expect, it } from "vitest";
import {
  createLongContentPost,
  createMockPost,
  createNullBodyPost,
} from "../../__tests__/fixtures/mock-post.js";
import { transformPost } from "../post-transformer.js";

describe("transformPost", () => {
  it("should transform post data correctly", () => {
    const mockPost = createMockPost();
    const result = transformPost(mockPost);

    expect(result).toEqual({
      url: mockPost.url,
      wip: "Shipped",
      kind: "stock",
      category_and_title_and_tags: mockPost.full_name,
      body_md: mockPost.body_md,
      created_at: mockPost.created_at,
      updated_at: mockPost.updated_at,
      created_by: mockPost.created_by,
      updated_by: mockPost.updated_by,
      stats: {
        tasks_count: 3,
        done_tasks_count: 2,
        comments_count: 5,
        stargazers_count: 10,
        watchers_count: 8,
      },
    });
  });

  it("should transform WIP post correctly", () => {
    const wipPost = createMockPost({ wip: true });
    const result = transformPost(wipPost);

    expect(result.wip).toBe("WIP");
  });

  it("should handle post with undefined body_md", () => {
    const postWithUndefinedBody = createNullBodyPost();
    const result = transformPost(postWithUndefinedBody);

    expect(result.body_md).toBe(undefined);
  });

  it("should truncate long body_md when truncateBody option is provided", () => {
    const longPost = createLongContentPost(600);

    const result = transformPost(longPost, { truncateBody: 500 });

    expect(result.body_md).toBe(`${"a".repeat(500)}...`);
  });

  it("should not truncate short body_md even when truncateBody option is provided", () => {
    const shortPost = createMockPost({ body_md: "Short content" });

    const result = transformPost(shortPost, { truncateBody: 500 });

    expect(result.body_md).toBe("Short content");
  });

  it("should handle post with undefined body_md when truncateBody option is provided", () => {
    const postWithUndefinedBody = createNullBodyPost();
    const result = transformPost(postWithUndefinedBody, { truncateBody: 500 });

    expect(result.body_md).toBe(undefined);
  });
});
