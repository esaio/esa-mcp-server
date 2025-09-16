import { describe, expect, it } from "vitest";
import { normalizeTeamName } from "../team-name-normalizer.js";

describe("normalizeTeamName", () => {
  it("should extract team name from URL-like input", () => {
    expect(normalizeTeamName("docs.example.com")).toBe("docs");
    expect(normalizeTeamName("my-team.example.com")).toBe("my-team");
    expect(normalizeTeamName("company.example.com")).toBe("company");
  });

  it("should leave normal team names unchanged", () => {
    expect(normalizeTeamName("docs")).toBe("docs");
    expect(normalizeTeamName("my-team")).toBe("my-team");
  });

  it("should handle edge cases", () => {
    expect(normalizeTeamName("")).toBe("");
    expect(normalizeTeamName(".")).toBe("");
    expect(normalizeTeamName("team.")).toBe("team");
  });
});
