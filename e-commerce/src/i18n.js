import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/common.json";
import hi from "./locales/hi/common.json";
import kn from "./locales/kn/common.json";
import ta from "./locales/ta/common.json";
import te from "./locales/te/common.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn },
      ta: { translation: ta },
      te: { translation: te }
    },
    lng: localStorage.getItem("language") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;