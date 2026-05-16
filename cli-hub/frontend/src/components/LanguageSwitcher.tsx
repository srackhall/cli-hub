import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const toggle = () => {
    const next = i18n.language === "zh-CN" ? "en-US" : "zh-CN"
    i18n.changeLanguage(next)
    localStorage.setItem("cli-hub-lang", next)
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} title={t("language.label")}>
      <Languages className="h-4 w-4 mr-1" />
      {t("language.switch")}
    </Button>
  )
}
