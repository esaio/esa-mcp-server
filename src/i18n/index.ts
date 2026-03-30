import i18next from "i18next";
import enTranslations from "../locales/en.json" with { type: "json" };
import jaTranslations from "../locales/ja.json" with { type: "json" };

export async function initI18n() {
  // https://github.com/neet/i18next-cli-language-detector/blob/main/src/i18next-cli-language-detector.ts
  // を参考に簡易版の環境変数からの自動検出
  const lng =
    process.env.LC_ALL?.split(/[-_.]/)[0] ||
    process.env.LC_MESSAGES?.split(/[-_.]/)[0] ||
    process.env.LANG?.split(/[-_.]/)[0] ||
    process.env.LANGUAGE?.split(/[-_.]/)[0] ||
    "en";
  await i18next.init({
    lng,
    fallbackLng: "en",
    resources: {
      ja: {
        translation: jaTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

  return i18next;
}

export function setLanguage(lng: string) {
  return i18next.changeLanguage(lng);
}

export function t(key: string, options?: Record<string, unknown>) {
  return i18next.t(key, options);
}
