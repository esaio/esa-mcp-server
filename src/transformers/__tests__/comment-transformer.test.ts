import { describe, expect, it } from "vitest";
import {
  createLongContentComment,
  createMockComment,
  createNullBodyComment,
} from "../../__tests__/fixtures/mock-comment.js";
import { transformComment } from "../comment-transformer.js";

describe("transformComment", () => {
  it("should transform comment data correctly", () => {
    const mockComment = createMockComment();
    const result = transformComment(mockComment);

    expect(result).toEqual({
      id: 123,
      post_number: 456,
      url: "https://test-team.esa.example.com/posts/456#comment-123",
      body_md: "This is a test comment content",
      created_at: "2024-01-01T00:00:00+09:00",
      updated_at: "2024-01-01T01:00:00+09:00",
      created_by: {
        name: "Test User",
        screen_name: "testuser",
        icon: "https://example.com/icon.png",
        myself: true,
      },
      stats: {
        stargazers_count: 5,
        star: true,
      },
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
          role: "member",
          posts_count: 10,
          joined_at: "2024-01-01T00:00:00+09:00",
          last_accessed_at: "2024-01-01T02:00:00+09:00",
        },
      ],
    });
  });

  it("should handle comment with no stargazers", () => {
    const commentWithoutStars = createMockComment({
      stargazers_count: 0,
      star: false,
      stargazers: undefined,
    });
    const result = transformComment(commentWithoutStars);

    expect(result.stats).toEqual({
      stargazers_count: 0,
      star: false,
    });
    expect(result.stargazers).toBe(undefined);
  });

  it("should handle comment with empty body_md", () => {
    const commentWithEmptyBody = createNullBodyComment();
    const result = transformComment(commentWithEmptyBody);

    expect(result.body_md).toBe("");
  });

  it("should truncate long body_md when truncateBody option is provided", () => {
    const longComment = createLongContentComment(400);

    const result = transformComment(longComment, { truncateBody: 300 });

    expect(result.body_md).toBe(`${"a".repeat(300)}...`);
  });

  it("should not truncate short body_md even when truncateBody option is provided", () => {
    const shortComment = createMockComment({ body_md: "Short comment" });

    const result = transformComment(shortComment, { truncateBody: 300 });

    expect(result.body_md).toBe("Short comment");
  });

  it("should handle comment with empty body_md when truncateBody option is provided", () => {
    const commentWithEmptyBody = createNullBodyComment();
    const result = transformComment(commentWithEmptyBody, {
      truncateBody: 300,
    });

    expect(result.body_md).toBe("");
  });

  it("should preserve all essential comment metadata", () => {
    const mockComment = createMockComment({
      id: 999,
      post_number: 789,
      url: "https://custom-team.esa.example.com/posts/789#comment-999",
      created_at: "2024-06-01T12:00:00+09:00",
      updated_at: "2024-06-01T13:00:00+09:00",
      created_by: {
        name: "Custom User",
        screen_name: "customuser",
        icon: "https://example.com/custom-icon.png",
        myself: false,
      },
    });

    const result = transformComment(mockComment);

    expect(result.id).toBe(999);
    expect(result.post_number).toBe(789);
    expect(result.url).toBe(
      "https://custom-team.esa.example.com/posts/789#comment-999",
    );
    expect(result.created_at).toBe("2024-06-01T12:00:00+09:00");
    expect(result.updated_at).toBe("2024-06-01T13:00:00+09:00");
    expect(result.created_by.name).toBe("Custom User");
    expect(result.created_by.screen_name).toBe("customuser");
  });
});
