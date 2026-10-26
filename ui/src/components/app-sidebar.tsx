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
} from "@/components/ui/sidebar"
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

export function AppSidebar({ page, onNavigate }: { page: PageId; onNavigate: (id: PageId) => void }) {
  const { t, lang, setLang } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()

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
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{t(group.group)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={page === item.id} tooltip={t(item.label)} onClick={() => onNavigate(item.id)}>
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
        <div className="flex items-center gap-1 px-1 group-data-[collapsible=icon]:flex-col">
          <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={() => setLang(lang === "ko" ? "en" : "ko")}>
            <LanguagesIcon />
            <span className="group-data-[collapsible=icon]:hidden">{lang === "ko" ? "한국어" : "English"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={resolvedTheme === "dark" ? t("theme.light") : t("theme.dark")}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
        <SidebarSeparator />
        <div className="group-data-[collapsible=icon]:hidden">
          <UpdatePanel />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
