import { describe, expect, it } from "vitest";
import { normalizeSearchQuery } from "../query-normalizer.js";

describe("normalizeSearchQuery", () => {
  describe("wildcard normalization", () => {
    it("should convert * to empty string", () => {
      expect(normalizeSearchQuery("*")).toBe("");
    });

    it("should not convert * when part of a larger query", () => {
      expect(normalizeSearchQuery("user:* tag:release")).toBe(
        "user:* tag:release",
      );
    });
  });

  describe("date syntax normalization", () => {
    it("should convert after: to created:>", () => {
      expect(normalizeSearchQuery("after:2025-08-16")).toBe(
        "created:>2025-08-16",
      );
    });

    it("should convert before: to created:<", () => {
      expect(normalizeSearchQuery("before:2025-08-16")).toBe(
        "created:<2025-08-16",
      );
    });

    it("should convert since: to created:>", () => {
      expect(normalizeSearchQuery("since:2025-08-16")).toBe(
        "created:>2025-08-16",
      );
    });

    it("should convert until: to created:<", () => {
      expect(normalizeSearchQuery("until:2025-08-16")).toBe(
        "created:<2025-08-16",
      );
    });

    it("should handle case-insensitive matching", () => {
      expect(normalizeSearchQuery("AFTER:2025-08-16")).toBe(
        "created:>2025-08-16",
      );
      expect(normalizeSearchQuery("After:2025-08-16")).toBe(
        "created:>2025-08-16",
      );
    });

    it("should handle multiple date patterns in one query", () => {
      expect(
        normalizeSearchQuery(
          "user:fukayatsu after:2025-08-16 before:2025-08-22",
        ),
      ).toBe("user:fukayatsu created:>2025-08-16 created:<2025-08-22");
    });

    it("should not convert partial matches", () => {
      expect(normalizeSearchQuery("notafter:2025-08-16")).toBe(
        "notafter:2025-08-16",
      );
      expect(normalizeSearchQuery("after:notadate")).toBe("after:notadate");
    });

    it("should handle complex queries with mixed syntax", () => {
      expect(
        normalizeSearchQuery(
          "user:fukayatsu after:2025-08-01 tag:release wip:false",
        ),
      ).toBe("user:fukayatsu created:>2025-08-01 tag:release wip:false");
    });
  });

  describe("no transformation needed", () => {
    it("should not modify valid esa syntax", () => {
      expect(normalizeSearchQuery("created:>2025-08-16")).toBe(
        "created:>2025-08-16",
      );
      expect(normalizeSearchQuery("updated:<2025-08-16")).toBe(
        "updated:<2025-08-16",
      );
    });

    it("should preserve normal search queries", () => {
      expect(normalizeSearchQuery("user:fukayatsu tag:release")).toBe(
        "user:fukayatsu tag:release",
      );
      expect(normalizeSearchQuery("category:dev wip:false")).toBe(
        "category:dev wip:false",
      );
    });

    it("should handle empty string", () => {
      expect(normalizeSearchQuery("")).toBe("");
    });
  });
});
