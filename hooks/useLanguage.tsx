import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dictionary, languageLocales, type Language } from "@/constants/translations";

type TranslationValues = Record<string, string | number>;

type LanguageContextType = {
  lang: Language;
  locale: string;
  setLang: (lang: Language) => void;
  t: (key: string, values?: TranslationValues) => string;
  tv: (message: string | null | undefined) => string | null;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  locale: languageLocales.en,
  setLang: () => {},
  t: (key) => key,
  tv: (message) => message ?? null
});

function interpolate(template: string, values?: TranslationValues) {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ""));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem("app_lang").then((saved) => {
      if (saved === "en" || saved === "si") setLangState(saved);
    });
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    AsyncStorage.setItem("app_lang", newLang);
  };

  const value = useMemo<LanguageContextType>(() => {
    const t = (key: string, values?: TranslationValues) => {
      const template = dictionary[lang][key] || dictionary.en[key] || key;
      return interpolate(template, values);
    };

    return {
      lang,
      locale: languageLocales[lang],
      setLang,
      t,
      tv: (message) => (message ? t(`validation.${message}`) : null)
    };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export type { Language };
