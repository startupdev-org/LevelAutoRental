import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ro from "./ro.json";
import ru from "./ru.json";

i18n
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem('selectedLanguage') || 'ro',
    fallbackLng: "ro",
    interpolation: { escapeValue: false },
    resources: { ro: { translation: ro }, ru: { translation: ru }, en: { translation: en } },
  });

export default i18n;
