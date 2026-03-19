import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getItem, setItem } from "../services/storage";
import { AppLanguage, resources } from "./resources";
import { extraResources } from "./extraResources";

export const SUPPORTED_LANGUAGES: AppLanguage[] = ["en", "gsw", "fr", "it"];
export const LANGUAGE_STORAGE_KEY = "app.language";

const mergedResources = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
  const extraTranslation = (extraResources as any)[lang]?.translation ?? {};
  acc[lang] = {
    translation: {
      ...resources[lang].translation,
      ...extraTranslation,
      common: {
        ...resources[lang].translation.common,
        ...(extraTranslation.common ?? {}),
      },
      auth: {
        ...resources[lang].translation.auth,
        ...(extraTranslation.auth ?? {}),
      },
      gameIndex: {
        ...resources[lang].translation.gameIndex,
        ...(extraTranslation.gameIndex ?? {}),
      },
    },
  };
  return acc;
}, {} as Record<AppLanguage, { translation: Record<string, any> }>);

function normalizeLanguageTag(languageTag?: string | null): AppLanguage {
  const value = (languageTag || "").toLowerCase();
  if (value.startsWith("gsw") || value.startsWith("de")) return "gsw";
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("it")) return "it";
  return "en";
}

export async function setAppLanguage(language: AppLanguage) {
  if (!SUPPORTED_LANGUAGES.includes(language)) return;
  await i18n.changeLanguage(language);
  await setItem(LANGUAGE_STORAGE_KEY, language);
}

async function bootstrapLanguage() {
  try {
    const stored = await getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
      await i18n.changeLanguage(stored as AppLanguage);
      return;
    }
    const localeTag = Localization.getLocales()[0]?.languageTag;
    await i18n.changeLanguage(normalizeLanguageTag(localeTag));
  } catch {
    await i18n.changeLanguage("en");
  }
}

i18n.use(initReactI18next).init({
  resources: mergedResources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

void bootstrapLanguage();

export default i18n;
