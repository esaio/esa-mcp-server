import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initI18n, setLanguage, t } from "../index.js";

describe("i18n", () => {
  // Helper to set language environment variable and initialize i18n
  const initI18nWithLang = async (envVar: string, value: string) => {
    vi.stubEnv(envVar, value);
    return await initI18n();
  };

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("LC_ALL", undefined);
    vi.stubEnv("LC_MESSAGES", undefined);
    vi.stubEnv("LANG", undefined);
    vi.stubEnv("LANGUAGE", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should detect language from LC_ALL env var", async () => {
    const i18n = await initI18nWithLang("LC_ALL", "ja_JP.UTF-8");
    expect(i18n.language).toBe("ja");
  });

  it("should detect language from LC_MESSAGES env var", async () => {
    const i18n = await initI18nWithLang("LC_MESSAGES", "ja_JP.UTF-8");
    expect(i18n.language).toBe("ja");
  });

  it("should detect language from LANG env var", async () => {
    const i18n = await initI18nWithLang("LANG", "ja_JP.UTF-8");
    expect(i18n.language).toBe("ja");
  });

  it("should detect language from LANGUAGE env var", async () => {
    const i18n = await initI18nWithLang("LANGUAGE", "ja_JP.UTF-8");
    expect(i18n.language).toBe("ja");
  });

  it("should fallback to en when no env vars are set", async () => {
    const i18n = await initI18n();
    expect(i18n.language).toBe("en");
  });

  it("should change language dynamically with setLanguage", async () => {
    await initI18n();
    await setLanguage("ja");
    expect(t("prompts.summarize_post.title")).toContain("要約");
  });
});
