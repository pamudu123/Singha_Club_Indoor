import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "si";

type Translations = Record<string, string>;

export const dictionary: Record<Language, Translations> = {
  en: {
    "settings.title": "Settings",
    "settings.subtitle": "Manage your club and preferences",
    "settings.notifications": "Notifications",
    "settings.notifications.subtitle": "Choose what you want to be notified about.",
    "settings.notifications.newBooking": "New Booking",
    "settings.notifications.accepted": "Accepted",
    "settings.notifications.rejected": "Rejected",
    "settings.notifications.onHold": "On Hold",
    "settings.notifications.dailySummary": "Daily Summary",
    "settings.userDetails": "User Details",
    "settings.userDetails.subtitle": "Update your personal information.",
    "settings.userDetails.name": "Name",
    "settings.userDetails.whatsapp": "WhatsApp Number",
    "settings.userDetails.email": "Email",
    "settings.bookingSettings": "Booking Settings",
    "settings.bookingSettings.subtitle": "Configure default booking preferences.",
    "settings.bookingSettings.defaultCurrency": "Default Currency",
    "settings.bookingSettings.slotDuration": "Slot Duration",
    "settings.bookingSettings.maxSlots": "Max Slots Per Booking",
    "settings.language": "Language",
    "settings.language.subtitle": "Select your preferred language.",
    "settings.adminProfile": "Admin Profile",
    "settings.adminProfile.subtitle": "Manage your admin account.",
    "settings.logout": "Logout",
    "tabs.dashboard": "Dashboard",
    "tabs.schedule": "Schedule",
    "tabs.requests": "Requests",
    "tabs.reports": "Reports",
    "tabs.settings": "Settings",
  },
  si: {
    "settings.title": "සැකසුම්",
    "settings.subtitle": "ඔබගේ සමාජය සහ මනාපයන් කළමනාකරණය කරන්න",
    "settings.notifications": "දැනුම්දීම්",
    "settings.notifications.subtitle": "ඔබට දැනුම් දිය යුතු දේ තෝරන්න.",
    "settings.notifications.newBooking": "නව වෙන්කිරීම්",
    "settings.notifications.accepted": "පිළිගත්",
    "settings.notifications.rejected": "ප්‍රතික්ෂේපිත",
    "settings.notifications.onHold": "රඳවා ඇත",
    "settings.notifications.dailySummary": "දෛනික සාරාංශය",
    "settings.userDetails": "පරිශීලක තොරතුරු",
    "settings.userDetails.subtitle": "ඔබගේ පුද්ගලික තොරතුරු යාවත්කාලීන කරන්න.",
    "settings.userDetails.name": "නම",
    "settings.userDetails.whatsapp": "වට්ස්ඇප් අංකය",
    "settings.userDetails.email": "විද්‍යුත් තැපෑල",
    "settings.bookingSettings": "වෙන්කිරීම් සැකසුම්",
    "settings.bookingSettings.subtitle": "පෙරනිමි වෙන්කිරීම් මනාපයන් සකසන්න.",
    "settings.bookingSettings.defaultCurrency": "පෙරනිමි මුදල්",
    "settings.bookingSettings.slotDuration": "කාලසීමාව",
    "settings.bookingSettings.maxSlots": "උපරිම වෙන්කිරීම් කාලසීමාවන්",
    "settings.language": "භාෂාව",
    "settings.language.subtitle": "ඔබේ භාෂාව තෝරන්න.",
    "settings.adminProfile": "පරිපාලක පැතිකඩ",
    "settings.adminProfile.subtitle": "ඔබගේ පරිපාලක ගිණුම කළමනාකරණය කරන්න.",
    "settings.logout": "ඉවත් වන්න",
    "tabs.dashboard": "ප්‍රධාන පුවරුව",
    "tabs.schedule": "කාලසටහන",
    "tabs.requests": "ඉල්ලීම්",
    "tabs.reports": "වාර්තා",
    "tabs.settings": "සැකසුම්",
  }
};

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

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

  const t = (key: string) => {
    return dictionary[lang][key] || dictionary["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
