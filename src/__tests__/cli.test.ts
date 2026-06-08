import { describe, expect, it } from "vitest";
import { handleCliArgs } from "../cli.js";
import { config } from "../config/index.js";

describe("CLI arguments", () => {
  it.each([["--help"], ["-h"]])("handles %s", (flag) => {
    expect(handleCliArgs([flag])).toEqual({
      type: "exit",
      status: 0,
      output: expect.stringContaining("Usage: esa-mcp-server"),
    });
  });

  it.each([["--version"], ["-v"]])("handles %s", (flag) => {
    expect(handleCliArgs([flag])).toEqual({
      type: "exit",
      status: 0,
      output: config.server.version,
    });
  });

  it("rejects unknown options", () => {
    expect(handleCliArgs(["--definitely-not-real"])).toEqual({
      type: "exit",
      status: 1,
      output: expect.stringContaining("Unknown option: --definitely-not-real"),
    });
  });

  it("continues server startup when no cli flags are provided", () => {
    expect(handleCliArgs([])).toEqual({ type: "continue" });
  });
});
