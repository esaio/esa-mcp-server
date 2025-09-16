import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../../package.json" with { type: "json" };

describe("config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("ESA_ACCESS_TOKEN", undefined);
    vi.stubEnv("ESA_API_BASE_URL", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("config object", () => {
    it("should have correct default values", async () => {
      const { config } = await import("../index.js");

      expect(config.esa.apiBaseUrl).toBe("https://api.esa.io");
      expect(config.server.name).toBe("esa-mcp-server");
      expect(config.server.version).toBe(packageJson.version);
      expect(config.server.description).toBe("Official MCP server for esa.io");
    });

    it("should use environment variables when set", async () => {
      vi.stubEnv("ESA_ACCESS_TOKEN", "test-token");
      vi.stubEnv("ESA_API_BASE_URL", "https://api.esa.localhost");

      const { config } = await import("../index.js");

      expect(config.esa.apiAccessToken).toBe("test-token");
      expect(config.esa.apiBaseUrl).toBe("https://api.esa.localhost");
    });
  });

  describe("validateConfig", () => {
    it("should throw error when ESA_ACCESS_TOKEN is not set", async () => {
      vi.stubEnv("ESA_ACCESS_TOKEN", undefined);

      const { validateConfig } = await import("../index.js");

      expect(() => validateConfig()).toThrow(
        "ESA_ACCESS_TOKEN environment variable is required",
      );
    });

    it("should not throw error when ESA_ACCESS_TOKEN is set", async () => {
      vi.stubEnv("ESA_ACCESS_TOKEN", "valid-token");

      const { validateConfig } = await import("../index.js");

      expect(() => validateConfig()).not.toThrow();
    });

    it("should throw error when ESA_ACCESS_TOKEN is empty string", async () => {
      vi.stubEnv("ESA_ACCESS_TOKEN", "");

      const { validateConfig } = await import("../index.js");

      expect(() => validateConfig()).toThrow(
        "ESA_ACCESS_TOKEN environment variable is required",
      );
    });
  });
});
