import en from "./locales/en.json";
import languageLabelsJson from "./locales/languageLabels.json";
import languageLocalesJson from "./locales/languageLocales.json";
import si from "./locales/si.json";

export type Language = "en" | "si";

export type Translations = Record<string, string>;

export const languageLabels = languageLabelsJson as Record<Language, string>;

export const languageLocales = languageLocalesJson as Record<Language, string>;

export const dictionary: Record<Language, Translations> = {
  en: en as Translations,
  si: si as Translations
};

