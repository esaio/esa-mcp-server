import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import {
  getMarkdownSyntaxHelp,
  getSearchOptionsHelp,
  HELP_DOCS,
  searchHelp,
} from "../helps.js";
import * as posts from "../posts.js";
import * as search from "../search.js";

// Mock the posts and search modules
vi.mock("../posts.js", () => ({
  getPost: vi.fn(),
}));

vi.mock("../search.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../search.js")>();
  return {
    ...actual,
    searchPosts: vi.fn(),
  };
});

describe("getSearchOptionsHelp", () => {
  const mockClient = {} as ReturnType<typeof createEsaClient>;

  it("should call getPost with correct parameters for search options documentation", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "mocked response" }],
    });

    const result = await getSearchOptionsHelp(mockClient, {});

    expect(mockGetPost).toHaveBeenCalledWith(mockClient, {
      teamName: HELP_DOCS.TEAM,
      postNumber: HELP_DOCS.SEARCH_OPTIONS_POST_ID,
    });

    expect((result.content[0] as TextContent).text).toBe("mocked response");
  });

  it("should handle API errors", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Post not found" }],
    });

    const result = await getSearchOptionsHelp(mockClient, {});

    expect((result.content[0] as TextContent).text).toContain("Error:");
  });

  it("should handle network errors", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Network connection failed" }],
    });

    const result = await getSearchOptionsHelp(mockClient, {});

    expect((result.content[0] as TextContent).text).toContain("Network connection failed");
  });

  it("should handle non-Error exceptions", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Unexpected error" }],
    });

    const result = await getSearchOptionsHelp(mockClient, {});

    expect((result.content[0] as TextContent).text).toContain("Unexpected error");
  });
});

describe("getMarkdownSyntaxHelp", () => {
  const mockClient = {} as ReturnType<typeof createEsaClient>;

  it("should call getPost with correct parameters for markdown syntax documentation", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "markdown syntax help" }],
    });

    const result = await getMarkdownSyntaxHelp(mockClient, {});

    expect(mockGetPost).toHaveBeenCalledWith(mockClient, {
      teamName: HELP_DOCS.TEAM,
      postNumber: HELP_DOCS.MARKDOWN_SYNTAX_POST_ID,
    });

    expect((result.content[0] as TextContent).text).toBe("markdown syntax help");
  });

  it("should handle API errors", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Access denied" }],
    });

    const result = await getMarkdownSyntaxHelp(mockClient, {});

    expect((result.content[0] as TextContent).text).toContain("Error:");
  });

  it("should handle network errors", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Network connection failed" }],
    });

    const result = await getMarkdownSyntaxHelp(mockClient, {});

    expect((result.content[0] as TextContent).text).toContain("Network connection failed");
  });

  it("should handle non-Error exceptions", async () => {
    const mockGetPost = vi.mocked(posts.getPost);
    mockGetPost.mockResolvedValue({
      content: [{ type: "text", text: "Error: Unexpected error" }],
    });

    const result = await getMarkdownSyntaxHelp(mockClient, {});

    expect((result.content[0] as TextContent).text).toContain("Unexpected error");
  });
});

describe("searchHelp", () => {
  const mockClient = {} as ReturnType<typeof createEsaClient>;

  it("should call searchPosts with docs team and correct parameters", async () => {
    const mockSearchPosts = vi.mocked(search.searchPosts);
    mockSearchPosts.mockResolvedValue({
      content: [{ type: "text", text: "mocked search results" }],
    });

    await searchHelp(mockClient, {
      query: "webhook API",
      page: 2,
      perPage: 20,
    });

    expect(mockSearchPosts).toHaveBeenCalledWith(mockClient, {
      teamName: HELP_DOCS.TEAM,
      sort: "best_match",
      query: "webhook API",
      page: 2,
      perPage: 20,
    });
  });

  it("should call searchPosts with minimal parameters", async () => {
    const mockSearchPosts = vi.mocked(search.searchPosts);
    mockSearchPosts.mockResolvedValue({
      content: [{ type: "text", text: "emoji help results" }],
    });

    const result = await searchHelp(mockClient, {
      query: "emoji reaction",
    });

    expect(mockSearchPosts).toHaveBeenCalledWith(mockClient, {
      teamName: HELP_DOCS.TEAM,
      sort: "best_match",
      query: "emoji reaction",
      page: undefined,
      perPage: undefined,
    });

    expect((result.content[0] as TextContent).text).toBe("emoji help results");
  });

  it("should handle API errors", async () => {
    const mockSearchPosts = vi.mocked(search.searchPosts);
    mockSearchPosts.mockResolvedValue({
      content: [{ type: "text", text: "Error: Search failed" }],
    });

    const result = await searchHelp(mockClient, {
      query: "test query",
    });

    expect((result.content[0] as TextContent).text).toContain("Error:");
  });

  it("should handle network errors", async () => {
    const mockSearchPosts = vi.mocked(search.searchPosts);
    mockSearchPosts.mockResolvedValue({
      content: [{ type: "text", text: "Error: Network connection failed" }],
    });

    const result = await searchHelp(mockClient, {
      query: "test query",
    });

    expect((result.content[0] as TextContent).text).toContain("Network connection failed");
  });

  it("should handle non-Error exceptions", async () => {
    const mockSearchPosts = vi.mocked(search.searchPosts);
    mockSearchPosts.mockResolvedValue({
      content: [{ type: "text", text: "Error: Unexpected error" }],
    });

    const result = await searchHelp(mockClient, {
      query: "test query",
    });

    expect((result.content[0] as TextContent).text).toContain("Unexpected error");
  });
});

describe("HELP_DOCS constants", () => {
  it("should have correct constant values", () => {
    expect(HELP_DOCS.TEAM).toBe("docs");
    expect(HELP_DOCS.SEARCH_OPTIONS_POST_ID).toBe(104);
    expect(HELP_DOCS.MARKDOWN_SYNTAX_POST_ID).toBe(49);
  });
});
