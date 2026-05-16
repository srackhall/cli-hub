import { useTranslation } from "react-i18next"

/**
 * Returns the appropriate value based on current language.
 * For zh-CN, prefers the Zh variant; otherwise uses the default (English).
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const isZh = i18n.language === "zh-CN"

  function text(en: string | undefined, zh: string | undefined): string | undefined {
    if (isZh && zh) return zh
    return en
  }

  return { isZh, text }
}
