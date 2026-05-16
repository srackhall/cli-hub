import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enUS from "./locales/en-US.json"
import zhCN from "./locales/zh-CN.json"

const savedLang = typeof localStorage !== "undefined" ? localStorage.getItem("cli-hub-lang") : null

i18n.use(initReactI18next).init({
  resources: {
    "en-US": { translation: enUS },
    "zh-CN": { translation: zhCN },
  },
  lng: savedLang ?? "en-US",
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
})

export default i18n
