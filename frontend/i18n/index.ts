import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { getItem, setItem } from "../services/storage";
import { resources, type AppLanguage } from "./translations";

const STORAGE_KEY = "app_language";

function deviceLanguage(): AppLanguage {
  const locale = getLocales()?.[0]?.languageTag ?? "en";
  if (locale.startsWith("de")) return "de-CH";
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("it")) return "it";
  return "en";
}

export function normalizeLanguage(input?: string | null): AppLanguage {
  if (input === "de" || input === "de-CH") return "de-CH";
  if (input === "fr") return "fr";
  if (input === "it") return "it";
  return "en";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });
}

export async function hydrateLanguage(): Promise<void> {
  const saved = await getItem(STORAGE_KEY);
  const next = normalizeLanguage(saved) || deviceLanguage();
  await i18n.changeLanguage(next);
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  const next = normalizeLanguage(lang);
  await i18n.changeLanguage(next);
  await setItem(STORAGE_KEY, next);
}

export function getCurrentLanguage(): AppLanguage {
  return normalizeLanguage(i18n.language);
}

export default i18n;
