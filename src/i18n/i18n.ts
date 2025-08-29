import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ro from "./ro.json";
import ru from "./ru.json";

i18n
  .use(initReactI18next)
  .init({
    lng: "ro",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: { en: { translation: en }, ro: { translation: ro }, ru: { translation: ru } },
  });

export default i18n;
