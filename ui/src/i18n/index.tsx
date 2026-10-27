import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import { plainText } from "@/lib/rich-text"
import type { SectionDef, SettingDef } from "@/schema"

import settingsKo from "./settings-ko.json"
import { en, ko, type UiKey } from "./ui"

export type Lang = "ko" | "en"
const STORAGE_KEY = "beolkkuri_lang"

type SchemaDict = {
  settings: Record<string, { title?: string; desc?: string }>
  sections: Record<string, { title?: string; desc?: string }>
  options: Record<string, string>
}
const schemaKo = settingsKo as SchemaDict

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "ko" || saved === "en") return saved
  } catch {
    // storage unavailable: fall through to default
  }
  return "ko"
}

type I18n = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: UiKey, vars?: Record<string, string | number>) => string
  /** Translated title/desc for a schema setting (falls back to the English source). */
  setting: (def: SettingDef) => { title: string; desc: string }
  section: (def: Pick<SectionDef, "title" | "desc">) => { title: string; desc: string }
  option: (label: string) => string
}

const I18nContext = createContext<I18n | null>(null)

/** Section titles carry emoji/icon markup; translations are keyed by their plain text. */
export const sectionKey = (title: string) => plainText(title).replace(/\p{Extended_Pictographic}|️|‍/gu, "").trim()

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
    document.documentElement.lang = next
  }, [])

  const value = useMemo<I18n>(() => {
    const dict = lang === "ko" ? ko : en
    const isKo = lang === "ko"
    return {
      lang,
      setLang,
      t: (key, vars) => {
        let text: string = dict[key] ?? en[key] ?? key
        if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v))
        return text
      },
      setting: (def) => {
        // separators have no id, so they are keyed by their title
        const tr = isKo ? schemaKo.settings[def.id ?? `sep:${plainText(def.title)}`] : undefined
        return { title: tr?.title ?? def.title, desc: tr?.desc ?? def.desc }
      },
      section: (def) => {
        const tr = isKo ? schemaKo.sections[sectionKey(def.title)] : undefined
        if (!tr) return { title: def.title, desc: def.desc }
        // keep any icon markup from the original title next to the translation
        const icons = def.title.match(/<img[^>]*>/g)?.join("") ?? ""
        return { title: (tr.title ?? def.title) + icons, desc: tr.desc ?? def.desc }
      },
      option: (label) => {
        if (!isKo) return label
        const key = sectionKey(label)
        const tr = schemaKo.options[key]
        if (!tr) return label
        // preserve a leading emoji/icon from the source label
        const lead = label.match(/^(\s*(<img[^>]*>|\p{Extended_Pictographic}️?)\s*)+/u)?.[0] ?? ""
        return lead + tr
      },
    }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider")
  return ctx
}

export type PageStrings<K extends string> = { ko: Record<K, string>; en: Record<K, string> }

/** Translator for a page-local string table: `const t = useStrings(strings)`. */
export function useStrings<K extends string>(strings: PageStrings<K>) {
  const { lang } = useI18n()
  return useCallback(
    (key: K, vars?: Record<string, string | number>) => {
      let text = strings[lang][key] ?? strings.en[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v))
      return text
    },
    [lang, strings],
  )
}
