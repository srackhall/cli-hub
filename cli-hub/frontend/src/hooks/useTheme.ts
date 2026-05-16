import { useState, useEffect, useCallback } from "react"

type Theme = "light" | "dark"

function getSystemTheme(): Theme {
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light"
  return "dark"
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem("cli-hub-theme")
  if (stored === "light" || stored === "dark") return stored
  return null
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem("cli-hub-theme", t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("cli-hub-theme", next)
      return next
    })
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    const handler = () => {
      if (!getStoredTheme()) {
        setThemeState(getSystemTheme())
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return { theme, setTheme, toggleTheme }
}
