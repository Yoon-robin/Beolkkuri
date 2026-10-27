import { ThemeProvider, useTheme } from "@/lib/theme"
import { useEffect, useLayoutEffect, useRef, type ComponentType } from "react"

import { CommandPalette } from "@/components/command-palette"
import { PageError, PageLoading } from "@/components/page"
import { NAV, PageTabs } from "@/components/page-tabs"
import { RunButton } from "@/components/run-controls"
import { StartSetupDialog } from "@/components/start-setup"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { UpdateProvider } from "@/components/update-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { I18nProvider, useI18n } from "@/i18n"
import { usePage, type PageId } from "@/lib/route"
import BoostPage from "@/pages/boost"
import CollectPage from "@/pages/collect"
import GatherPage from "@/pages/gather"
import GuidePage from "@/pages/guide"
import HomePage, { ControlPanel } from "@/pages/home"
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

/**
 * The first time Beolkkuri opens, start on the guide instead of Home. Someone who already
 * set a private server (an install from before this setting) has been through it.
 */
function useFirstRunGuide(setPage: (page: PageId) => void) {
  const { settings, saveGeneral } = useSettings()
  const checked = useRef(false)

  useEffect(() => {
    if (!settings || checked.current) return
    checked.current = true
    if (settings.guide_shown) return
    if (!settings.private_server_link) setPage("guide")
    void saveGeneral("guide_shown", true)
  }, [settings, setPage, saveGeneral])
}

const SIDE_TABS = NAV.filter((item) => item.id !== "home")

/**
 * The control panel (start, mode, tasks, logs) stays on the left beside every page, and the
 * pages are tabs along the top. A narrow window has no room for both, so there the panel
 * becomes the first tab, Home.
 */
function Shell() {
  usePersistedPreferences()
  const { t } = useI18n()
  const [page, setPage] = usePage()
  useFirstRunGuide(setPage)
  const wide = !useIsMobile()
  // Home is the panel itself in a wide window, so its link opens the first task page beside it
  const shown: PageId = wide && page === "home" ? "gather" : page
  const { settings, loadError, refresh } = useSettings()
  const Current = PAGE_COMPONENTS[shown]
  const label = NAV.find((i) => i.id === shown)?.label

  useEffect(() => {
    document.title = label ? `${t(label)} · ${t("app.name")}` : t("app.name")
  }, [label, t])

  // each page starts at the top instead of keeping the previous page's scroll position
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [shown])

  return (
    <div className="flex min-h-svh">
      {wide && <ControlPanel layout="side" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur">
          <PageTabs page={shown} items={wide ? SIDE_TABS : NAV} />
          {/* the panel holds these in a wide window */}
          {!wide && (
            <div className="flex shrink-0 items-center gap-2 pr-3">
              <CommandPalette />
              {shown !== "home" && <RunButton />}
            </div>
          )}
        </header>
        <main className="min-w-0 flex-1">{settings ? <Current key={shown} /> : loadError ? <PageError onRetry={refresh} /> : <PageLoading />}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <I18nProvider>
        <TooltipProvider delayDuration={300}>
          <SettingsProvider>
            <RunStateProvider>
              <UpdateProvider>
                <Shell />
              </UpdateProvider>
              <StartSetupDialog />
              <Toaster richColors position="bottom-right" />
            </RunStateProvider>
          </SettingsProvider>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
