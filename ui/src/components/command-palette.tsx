import { LanguagesIcon, MoonIcon, PlayIcon, SearchIcon, SearchXIcon, SquareIcon, SunIcon } from "lucide-react"
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react"

import { NAV } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { sectionKey, useI18n, useStrings, type PageStrings } from "@/i18n"
import schemaKo from "@/i18n/settings-ko.json"
import { en as uiEn, ko as uiKo } from "@/i18n/ui"
import { goToTarget, locateSection } from "@/lib/focus"
import type { PageId } from "@/lib/route"
import { plainText } from "@/lib/rich-text"
import { useTheme } from "@/lib/theme"
import { sections } from "@/schema"
import { useRun } from "@/state/run-state"

const strings: PageStrings<
  | "trigger"
  | "title"
  | "placeholder"
  | "empty"
  | "emptyHint"
  | "move"
  | "open"
  | "close"
  | "pages"
  | "actions"
  | "settings"
  | "start"
  | "stop"
  | "light"
  | "dark"
  | "language"
> = {
  ko: {
    trigger: "설정 검색",
    title: "검색",
    placeholder: "설정, 메뉴, 기능을 찾아보세요… (예: 벌집, 디스코드, 시계)",
    empty: "검색 결과가 없어요",
    emptyHint: "다른 낱말로 찾아보세요. 초성으로도 찾을 수 있어요. (예: ㅂㅈ → 벌집)",
    move: "이동",
    open: "열기",
    close: "닫기",
    pages: "메뉴",
    actions: "빠른 실행",
    settings: "설정",
    start: "매크로 시작",
    stop: "매크로 정지",
    light: "밝은 테마로 바꾸기",
    dark: "어두운 테마로 바꾸기",
    language: "Switch to English",
  },
  en: {
    trigger: "Search settings",
    title: "Search",
    placeholder: "Find a setting, page or action… (e.g. hive, discord, clock)",
    empty: "No results",
    emptyHint: "Try a different word.",
    move: "Move",
    open: "Open",
    close: "Close",
    pages: "Pages",
    actions: "Quick actions",
    settings: "Settings",
    start: "Start the macro",
    stop: "Stop the macro",
    light: "Switch to light theme",
    dark: "Switch to dark theme",
    language: "한국어로 바꾸기",
  },
}

const navItems = new Map(NAV.flatMap((g) => g.items).map((i) => [i.id, i]))
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
const ko = schemaKo as { settings: Record<string, { title?: string } | undefined>; sections: Record<string, { title?: string } | undefined> }

// ---------------------------------------------------------------- search
// cmdk's built-in fuzzy match lets any letters in order match ("clock" finds
// "sticker stack"), and it can't rank items that appear in the same render as the
// query changes, so the palette filters and orders results itself. Every word of the
// query must appear: Korean anywhere (spaces optional), Latin at the start of a word,
// and consonant-only Korean by initials (ㅂㅈ finds 벌집).

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
const initials = (text: string) => text.replace(/[가-힣]/g, (c) => CHO[Math.floor((c.charCodeAt(0) - 0xac00) / 588)])
const compact = (text: string) => text.replace(/\s+/g, "")
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const onlyInitials = (word: string) => /^[ㄱ-ㅎ]+$/.test(word)

function contains(text: string, word: string) {
  if (onlyInitials(word)) return compact(initials(text)).includes(word)
  if (/^[a-z0-9]/.test(word)) return new RegExp(`(^|[^a-z0-9])${escapeRe(word)}`).test(text)
  return text.includes(word) || compact(text).includes(word)
}

function startsWith(text: string, query: string) {
  const q = compact(query)
  return compact(text).startsWith(q) || (onlyInitials(q) && compact(initials(text)).startsWith(q))
}

/**
 * 0 for no match, else higher is better. Keywords are [shown label, the label in the other
 * language, ...extra terms]; a word found in a label counts for more than one found only
 * in the extra terms.
 */
function matchScore(search: string, keywords: string[]) {
  const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  const [label = "", alt = "", ...extra] = keywords.map((k) => k.toLowerCase())
  let inLabel = 0
  for (const word of words) {
    if (contains(label, word)) inLabel += 1
    else if (contains(alt, word)) inLabel += 0.8
    else if (!extra.some((k) => contains(k, word))) return 0
  }
  // a label that starts with the query beats the rest, and shorter labels win ties
  const query = words.join(" ")
  const exact = [label, alt, ...extra].includes(query)
  const lead = exact || startsWith(label, query) ? 0.25 : startsWith(alt, query) ? 0.2 : 0
  return 0.3 + 0.35 * (inLabel / words.length) + lead + 0.1 * (1 - Math.min(label.length, 40) / 40)
}

/** Sub-tabs inside pages, so "보스" or "티켓 계산기" lands on the right tab. */
const SUBTABS: { page: PageId; tab: string; ko: string; en: string }[] = [
  { page: "collect", tab: "collect-dispensers", ko: "디스펜서", en: "Dispensers" },
  { page: "collect", tab: "collect-activities", ko: "활동", en: "Activities" },
  { page: "collect", tab: "collect-seasonal", ko: "시즌 이벤트", en: "Seasonal" },
  { page: "collect", tab: "collect-sprouts", ko: "새싹", en: "Sprouts" },
  { page: "collect", tab: "collect-blender", ko: "블렌더", en: "Blender" },
  { page: "kill", tab: "kill-settings", ko: "설정", en: "Settings" },
  { page: "kill", tab: "kill-regular", ko: "일반 몹", en: "Regular" },
  { page: "kill", tab: "kill-boss", ko: "보스", en: "Bosses" },
  { page: "kill", tab: "kill-misc", ko: "기타", en: "Misc" },
  { page: "boost", tab: "hotbar", ko: "핫바", en: "Hotbar" },
  { page: "boost", tab: "buffs", ko: "버프", en: "Buffs" },
  { page: "boost", tab: "tad", ko: "TAD 부계정 동기화", en: "TAD Alt Sync" },
  { page: "quests", tab: "quests-quests", ko: "퀘스트", en: "Quests" },
  { page: "quests", tab: "quests-settings", ko: "설정", en: "Settings" },
  { page: "tools", tab: "autoclicker", ko: "오토 클릭", en: "Auto Clicker" },
  { page: "tools", tab: "hotbar-buff", ko: "핫바 버프", en: "Hotbar Buff" },
  { page: "tools", tab: "bond-calculator", ko: "유대감 계산기", en: "Bond Calculator" },
  { page: "tools", tab: "ticket-calculator", ko: "티켓 계산기", en: "Ticket Price Calculator" },
  { page: "tools", tab: "auto-gifted-basic-bee", ko: "기프티드 기본 벌", en: "Auto Gifted Basic Bee" },
  { page: "settings", tab: "bss", ko: "게임 설정", en: "Game" },
  { page: "settings", tab: "priorities", ko: "작업 우선순위", en: "Task priorities" },
  { page: "settings", tab: "other", ko: "기타 설정", en: "Other" },
  { page: "settings", tab: "discord", ko: "디스코드", en: "Discord" },
  { page: "settings", tab: "stream", ko: "화면 공유", en: "Stream" },
  { page: "settings", tab: "profiles", ko: "프로필", en: "Profiles" },
]

type SettingEntry = { id: string; title: string; trail: string; keywords: string[]; target: ReturnType<typeof locateSection> }

function useSettingEntries(): SettingEntry[] {
  const { t, lang, setting, section } = useI18n()
  return useMemo(() => {
    const pageLabel = new Map(NAV.flatMap((g) => g.items).map((i) => [i.id, t(i.label)]))
    const seen = new Set<string>()
    const out: SettingEntry[] = []
    for (const sec of sections) {
      const base = locateSection(sec)
      const secTitle = plainText(section(sec).title)
      for (const def of sec.settings) {
        if (!def.id || seen.has(def.id)) continue
        seen.add(def.id)
        const title = plainText(setting(def).title)
        if (!title) continue
        out.push({
          id: def.id,
          title,
          trail: `${pageLabel.get(base.page) ?? ""} › ${secTitle}`,
          // the shown title, the other language's title, then the section in both languages
          keywords: [
            title,
            lang === "ko" ? plainText(def.title) : (ko.settings[def.id]?.title ?? ""),
            ko.sections[sectionKey(sec.title)]?.title ?? "",
            sectionKey(sec.title),
          ],
          target: { ...base, settingId: def.id },
        })
      }
    }
    return out
    // `lang` changes the translated titles
  }, [t, lang, setting, section])
}

function Key({ children }: { children: string }) {
  return <kbd className="inline-flex min-w-5 justify-center rounded border bg-muted px-1 font-mono text-[0.68rem] text-foreground/80">{children}</kbd>
}

type Row = { key: string; keywords: string[]; onSelect: () => void; content: ReactNode }

/** Ctrl/⌘+K search over pages, quick actions and every setting. */
export function CommandPalette() {
  const s = useStrings(strings)
  const { t, lang, setLang } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()
  const { status, start, stop } = useRun()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const entries = useSettingEntries()

  // every opening starts with an empty query
  const openPalette = (next: boolean) => {
    if (next) setSearch("")
    setOpen(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => {
          if (!v) setSearch("")
          return !v
        })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }
  const running = status === "running" || status === "paused"
  const searching = search.trim() !== ""
  const dark = resolvedTheme === "dark"

  const actions: Row[] = [
    {
      key: "run",
      keywords: [running ? s("stop") : s("start"), "", "start", "stop", "run", "macro", "시작", "정지", "매크로"],
      onSelect: running ? stop : start,
      content: (
        <>
          {running ? <SquareIcon /> : <PlayIcon />}
          {running ? s("stop") : s("start")}
        </>
      ),
    },
    {
      key: "theme",
      keywords: [dark ? s("light") : s("dark"), "", "theme", "dark", "light", "테마", "다크", "라이트", "밝은", "어두운"],
      onSelect: () => setTheme(dark ? "light" : "dark"),
      content: (
        <>
          {dark ? <SunIcon /> : <MoonIcon />}
          {dark ? s("light") : s("dark")}
        </>
      ),
    },
    {
      key: "language",
      keywords: [s("language"), "", "language", "english", "korean", "언어", "영어", "한국어"],
      onSelect: () => setLang(lang === "ko" ? "en" : "ko"),
      content: (
        <>
          <LanguagesIcon />
          {s("language")}
        </>
      ),
    },
  ]

  const pages: Row[] = [...navItems.values()].map((item) => ({
    key: item.id,
    keywords: [t(item.label), lang === "ko" ? uiEn[item.label] : uiKo[item.label], item.id],
    onSelect: () => goToTarget({ page: item.id }),
    content: (
      <>
        <item.icon />
        {t(item.label)}
      </>
    ),
  }))
  // sub-tabs and the few hundred settings only show once there is something to match
  if (searching) {
    for (const sub of SUBTABS) {
      const nav = navItems.get(sub.page)!
      pages.push({
        key: `${sub.page}:${sub.tab}`,
        keywords: [sub[lang], lang === "ko" ? sub.en : sub.ko, uiKo[nav.label], uiEn[nav.label]],
        onSelect: () => goToTarget({ page: sub.page, tab: sub.tab }),
        content: (
          <>
            <nav.icon />
            <span className="text-muted-foreground">{t(nav.label)} ›</span>
            {sub[lang]}
          </>
        ),
      })
    }
  }

  const settingRows: Row[] = searching
    ? entries.map((e) => ({
        key: e.id,
        keywords: e.keywords,
        onSelect: () => goToTarget(e.target),
        content: (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{e.title}</span>
              <span className="truncate text-xs text-muted-foreground">{e.trail}</span>
            </div>
            <CommandShortcut className="tracking-normal opacity-0 transition-opacity group-data-selected/command-item:opacity-100">↵</CommandShortcut>
          </>
        ),
      }))
    : []

  // best matches first, and the group holding the best match first; actions and pages
  // get a small head start since they are what people look for most
  const groups = [
    { key: "actions", heading: s("actions"), rows: actions, bias: 0.15 },
    { key: "pages", heading: s("pages"), rows: pages, bias: 0.1 },
    { key: "settings", heading: s("settings"), rows: settingRows, bias: 0 },
  ]
    .map((g) => {
      const scored = g.rows
        .map((row) => ({ row, score: searching ? matchScore(search, row.keywords) : 1 }))
        .filter((r) => r.score > 0)
        .map((r) => ({ ...r, score: r.score + g.bias }))
      if (searching) scored.sort((a, b) => b.score - a.score)
      return { ...g, rows: scored.map((r) => r.row), best: scored[0]?.score ?? 0 }
    })
    .filter((g) => g.rows.length > 0)
  if (searching) groups.sort((a, b) => b.best - a.best)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-muted-foreground md:w-52 md:justify-start"
        onClick={() => openPalette(true)}
        aria-label={s("trigger")}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
      >
        <SearchIcon />
        <span className="hidden md:inline">{s("trigger")}</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[0.68rem] md:inline">{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={openPalette} title={s("title")} description={s("placeholder")} className="sm:max-w-xl">
        <Command loop shouldFilter={false}>
          <CommandInput placeholder={s("placeholder")} value={search} onValueChange={setSearch} />
          {/* the list eases to its new height as results come and go */}
          <CommandList className="h-(--cmdk-list-height) max-h-[min(calc(67vh-7rem),26rem)] transition-[height] duration-200 ease-out">
            <CommandEmpty className="flex flex-col items-center gap-1 px-6 py-8">
              <SearchXIcon className="mb-1 size-5 text-muted-foreground" />
              <span className="font-medium">{s("empty")}</span>
              <span className="text-xs text-muted-foreground">{s("emptyHint")}</span>
            </CommandEmpty>
            {groups.map((g, i) => (
              <Fragment key={g.key}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={g.heading}>
                  {g.rows.map((row) => (
                    <CommandItem key={row.key} value={`${g.key}:${row.key}`} onSelect={run(row.onSelect)}>
                      {row.content}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
          <div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground" aria-hidden>
            <span className="flex items-center gap-1.5">
              <Key>↑</Key>
              <Key>↓</Key>
              {s("move")}
            </span>
            <span className="flex items-center gap-1.5">
              <Key>↵</Key>
              {s("open")}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <Key>Esc</Key>
              {s("close")}
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  )
}
