import { ThemeProvider, useTheme } from "@/lib/theme"
import { useEffect, useLayoutEffect, useRef, type ComponentType } from "react"

import { AppSidebar, NAV } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { PageError, PageLoading } from "@/components/page"
import { RunButton, RunStatusBadge } from "@/components/run-controls"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { I18nProvider, useI18n } from "@/i18n"
import { isMac } from "@/lib/platform"
import { isDesktopApp } from "@/lib/py"
import { usePage, type PageId } from "@/lib/route"
import BoostPage from "@/pages/boost"
import CollectPage from "@/pages/collect"
import GatherPage from "@/pages/gather"
import GuidePage from "@/pages/guide"
import HomePage from "@/pages/home"
import KillPage from "@/pages/kill"
import PlantersPage from "@/pages/planters"
import QuestsPage from "@/pages/quests"
import SettingsPage from "@/pages/settings"
import ToolsPage from "@/pages/tools"
import { RunStateProvider } from "@/state/run-state"
import { SettingsProvider, useSettings } from "@/state/settings"

const PAGE_COMPONENTS: Record<PageId, ComponentType> = {
  home: HomePage,
  guide: GuidePage,
  gather: GatherPage,
  collect: CollectPage,
  kill: KillPage,
  boost: BoostPage,
  quests: QuestsPage,
  planters: PlantersPage,
  tools: ToolsPage,
  settings: SettingsPage,
}

/**
 * The app window runs in an incognito Chrome profile, so browser storage is wiped
 * on every launch. Language and theme are therefore kept in the macro's settings.
 */
function usePersistedPreferences() {
  const { settings, saveGeneral } = useSettings()
  const { lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const adopted = useRef(false)

  useEffect(() => {
    if (!settings || adopted.current) return
    adopted.current = true
    if (settings.ui_language === "ko" || settings.ui_language === "en") setLang(settings.ui_language)
    if (settings.ui_theme === "light" || settings.ui_theme === "dark" || settings.ui_theme === "system") setTheme(settings.ui_theme)
  }, [settings, setLang, setTheme])

  useEffect(() => {
    if (adopted.current && settings && settings.ui_language !== lang) void saveGeneral("ui_language", lang)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (adopted.current && settings && theme && settings.ui_theme !== theme) void saveGeneral("ui_theme", theme)
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps
}

function Shell() {
  usePersistedPreferences()
  const { t } = useI18n()
  const [page, setPage] = usePage()
  const { settings, loadError, refresh } = useSettings()
  const Current = PAGE_COMPONENTS[page]
  const label = NAV.flatMap((g) => g.items).find((i) => i.id === page)?.label

  useEffect(() => {
    document.title = label ? `${t(label)} · RobinMacro` : "RobinMacro"
  }, [label, t])

  // each page starts at the top instead of keeping the previous page's scroll position
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  return (
    <SidebarProvider>
      <AppSidebar page={page} onNavigate={setPage} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger label={t("nav.toggle")} />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t("nav.toggle")} <kbd className="ml-1 rounded bg-background/20 px-1 font-mono text-[0.7rem]">{isMac ? "⌘B" : "Ctrl+B"}</kbd>
            </TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-5 data-vertical:self-center" />
          {/* the page name keeps its room; the dev-mode note gives way first */}
          <span className="shrink-0 text-sm font-medium">{label ? t(label) : ""}</span>
          {!isDesktopApp() && <span className="hidden min-w-0 truncate text-xs text-muted-foreground md:inline">· {t("devBanner")}</span>}
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <RunStatusBadge className="hidden sm:inline-flex" />
            {page !== "home" && <RunButton />}
          </div>
        </header>
        {/* SidebarInset is already the page's <main> */}
        <div className="min-w-0 flex-1">{settings ? <Current key={page} /> : loadError ? <PageError onRetry={refresh} /> : <PageLoading />}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <I18nProvider>
        <TooltipProvider delayDuration={300}>
          <SettingsProvider>
            <RunStateProvider>
              <Shell />
              <Toaster richColors position="bottom-right" />
            </RunStateProvider>
          </SettingsProvider>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
