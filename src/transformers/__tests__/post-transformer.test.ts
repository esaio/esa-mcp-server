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
      revision_number: mockPost.revision_number,
      wip: "Shipped",
      kind: "stock",
      category_and_title_and_tags: mockPost.full_name,
      body_md: mockPost.body_md,
      body_md_stats: {
        characters: 41,
        lines: 3,
      },
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

    expect(result.body_md).toBe(`${"a".repeat(500)}\n\n... (truncated)`);
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

  it("should report stats for the full body even when truncated", () => {
    const longPost = createLongContentPost(600);

    const result = transformPost(longPost, { truncateBody: 500 });

    expect(result.body_md).toBe(`${"a".repeat(500)}\n\n... (truncated)`);
    expect(result.body_md_stats).toEqual({ characters: 600, lines: 1 });
  });

  it("should omit body_md_stats when body_md is omitted", () => {
    const result = transformPost(createMockPost(), { omitBody: true });

    expect(result.body_md).toBe(undefined);
    expect(result).not.toHaveProperty("body_md_stats");
  });

  it("should omit body_md_stats when body_md is undefined", () => {
    const result = transformPost(createNullBodyPost());

    expect(result).not.toHaveProperty("body_md_stats");
  });

  it("should count characters by grapheme cluster", () => {
    // The family emoji is a single grapheme built from 7 code points
    // (11 UTF-16 code units); it must count as one character.
    const post = createMockPost({ body_md: "a👨‍👩‍👧‍👦b" });

    const result = transformPost(post);

    expect(result.body_md_stats).toEqual({ characters: 3, lines: 1 });
  });

  it("should include backlinks_count when present", () => {
    const post = createMockPost({ backlinks_count: 3 });
    const result = transformPost(post);

    expect(result.backlinks_count).toBe(3);
  });

  it("should omit backlinks_count when not returned by the API", () => {
    const post = createMockPost();
    const result = transformPost(post);

    expect(result).not.toHaveProperty("backlinks_count");
  });
});
