import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Theme = "light" | "dark" | "system"

type ThemeStore = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  /** Pass the click position to reveal the new theme in a circle growing from it. */
  setTheme: (theme: Theme, origin?: { x: number; y: number }) => void
}

const ThemeContext = createContext<ThemeStore | null>(null)
const STORAGE_KEY = "beolkkuri_theme"
const media = () => window.matchMedia("(prefers-color-scheme: dark)")

const resolve = (theme: Theme): "light" | "dark" => (theme === "system" ? (media().matches ? "dark" : "light") : theme)

const applyTheme = (resolved: "light" | "dark") => {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void> } }

const readStored = (fallback: Theme): Theme => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === "light" || v === "dark" || v === "system" ? v : fallback
  } catch {
    return fallback
  }
}

/**
 * Class-based light/dark theme. next-themes renders an inline <script> to avoid a
 * flash on SSR pages, which React 19 warns about in a client-only app like this one.
 */
export function ThemeProvider({ children, defaultTheme = "dark" }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => readStored(defaultTheme))
  const [systemDark, setSystemDark] = useState(() => media().matches)

  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener("change", onChange)
    return () => m.removeEventListener("change", onChange)
  }, [])

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme

  useEffect(() => applyTheme(resolvedTheme), [resolvedTheme])

  const setTheme = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable in the incognito app window; settings keep the choice.
    }
    const doc = document as ViewTransitionDocument
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!origin || !doc.startViewTransition || reduced) {
      setThemeState(next)
      return
    }
    const transition = doc.startViewTransition(() => {
      // switch the class synchronously so the transition captures the new theme
      applyTheme(resolve(next))
      setThemeState(next)
    })
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y))
    void transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 500, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
      )
    })
  }, [])

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
