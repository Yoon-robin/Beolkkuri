import {
  BugIcon,
  CompassIcon,
  FlowerIcon,
  HomeIcon,
  LanguagesIcon,
  MoonIcon,
  PackageIcon,
  ScrollTextIcon,
  SettingsIcon,
  SproutIcon,
  SunIcon,
  WrenchIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { useLayoutEffect, useState } from "react"

import { useTheme } from "@/lib/theme"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/i18n"
import type { UiKey } from "@/i18n/ui"
import type { PageId } from "@/lib/route"

import { UpdatePanel } from "./update-panel"

export const NAV: { group: UiKey; items: { id: PageId; label: UiKey; icon: LucideIcon }[] }[] = [
  {
    group: "nav.group.main",
    items: [
      { id: "home", label: "nav.home", icon: HomeIcon },
      { id: "guide", label: "nav.guide", icon: CompassIcon },
    ],
  },
  {
    group: "nav.group.tasks",
    items: [
      { id: "gather", label: "nav.gather", icon: FlowerIcon },
      { id: "collect", label: "nav.collect", icon: PackageIcon },
      { id: "kill", label: "nav.kill", icon: BugIcon },
      { id: "boost", label: "nav.boost", icon: ZapIcon },
      { id: "quests", label: "nav.quests", icon: ScrollTextIcon },
      { id: "planters", label: "nav.planters", icon: SproutIcon },
    ],
  },
  {
    group: "nav.group.more",
    items: [
      { id: "tools", label: "nav.tools", icon: WrenchIcon },
      { id: "settings", label: "nav.settings", icon: SettingsIcon },
    ],
  },
]

type Box = { x: number; y: number; w: number; h: number }

/**
 * One highlight behind the current page's menu item that slides to the next item,
 * across the group labels, instead of each item lighting up on its own.
 */
// `container` is the element itself, not a ref: the sidebar swaps its mobile and desktop
// versions after the first render, and the new one has to be measured.
function NavGlider({ container: el, page }: { container: HTMLDivElement | null; page: PageId }) {
  const [box, setBox] = useState<Box | null>(null)

  useLayoutEffect(() => {
    if (!el) return setBox(null)
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[data-sidebar="menu-button"][data-active="true"]')
      if (!active?.offsetWidth) return setBox(null)
      const a = active.getBoundingClientRect()
      const c = el.getBoundingClientRect()
      setBox({ x: a.left - c.left, y: a.top - c.top + el.scrollTop, w: a.width, h: a.height })
    }
    measure()
    // collapsing to icons and resizing the window move the items
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    return () => resize.disconnect()
  }, [el, page])

  if (!box) return null
  return (
    <span
      aria-hidden
      className="rm-glider pointer-events-none absolute top-0 left-0 rounded-md bg-sidebar-accent"
      style={{ transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h }}
    >
      <span className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary group-data-[collapsible=icon]:hidden" />
    </span>
  )
}

export function AppSidebar({ page, onNavigate }: { page: PageId; onNavigate: (id: PageId) => void }) {
  const { t, lang, setLang } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()
  const { state, isMobile } = useSidebar()
  const [nav, setNav] = useState<HTMLDivElement | null>(null)
  // footer buttons lose their text in icon mode, so they explain themselves on hover there
  const iconOnly = state === "collapsed" && !isMobile
  const nextLang = lang === "ko" ? "English" : "한국어"
  const themeLabel = resolvedTheme === "dark" ? t("theme.light") : t("theme.dark")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => onNavigate("home")} className="gap-3">
              <img src="./icon.png" alt="" className="size-8 shrink-0 rounded-lg" draggable={false} />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{t("app.name")}</span>
                <span className="truncate text-xs text-muted-foreground">{t("app.tagline")}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent ref={setNav} className="relative">
        <NavGlider container={nav} page={page} />
        {NAV.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{t(group.group)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={page === item.id}
                      tooltip={t(item.label)}
                      onClick={() => onNavigate(item.id)}
                      // NavGlider draws the selected item's background and bar
                      className="relative data-active:bg-transparent [&>svg]:transition-[transform,color] [&>svg]:duration-200 hover:[&>svg]:scale-110 data-active:[&>svg]:text-primary"
                    >
                      <item.icon />
                      <span>{t(item.label)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-1 px-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                aria-label={`${t("lang.label")}: ${lang === "ko" ? "한국어" : "English"} → ${nextLang}`}
                onClick={() => setLang(lang === "ko" ? "en" : "ko")}
              >
                <LanguagesIcon />
                <span className="group-data-[collapsible=icon]:hidden">{lang === "ko" ? "한국어" : "English"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={!iconOnly}>
              {t("lang.label")} · {nextLang}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="group-data-[collapsible=icon]:size-8"
                aria-label={themeLabel}
                onClick={(e) => setTheme(resolvedTheme === "dark" ? "light" : "dark", { x: e.clientX, y: e.clientY })}
              >
                <span key={resolvedTheme} className="rm-pop inline-flex">
                  {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side={iconOnly ? "right" : "top"}>{themeLabel}</TooltipContent>
          </Tooltip>
        </div>
        <SidebarSeparator />
        <UpdatePanel iconOnly={iconOnly} />
      </SidebarFooter>
    </Sidebar>
  )
}
