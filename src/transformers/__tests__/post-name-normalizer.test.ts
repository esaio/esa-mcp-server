import { describe, expect, it } from "vitest";
import { normalizePostName } from "../post-name-normalizer.js";

describe("normalizePostName", () => {
  it("should split name with slashes", () => {
    expect(normalizePostName("docs/api/authentication")).toEqual({
      name: "authentication",
      category: "docs/api",
    });
  });

  it("should not split when category is specified", () => {
    expect(normalizePostName("docs/guide", "custom")).toEqual({
      name: "docs/guide",
      category: "custom",
    });
  });

  it("should preserve empty string category", () => {
    expect(normalizePostName("docs/guide", "")).toEqual({
      name: "docs/guide",
      category: "",
    });
  });

  it("should handle name without slashes", () => {
    expect(normalizePostName("simple")).toEqual({
      name: "simple",
      category: undefined,
    });
  });

  it("should handle trailing slash as undefined name", () => {
    expect(normalizePostName("folder/")).toEqual({
      name: undefined,
      category: "folder",
    });
  });

  it("should handle leading slash", () => {
    expect(normalizePostName("/guide")).toEqual({
      name: "guide",
      category: "",
    });
  });

  it("should handle undefined name", () => {
    expect(normalizePostName(undefined, "category")).toEqual({
      name: undefined,
      category: "category",
    });
  });
});
