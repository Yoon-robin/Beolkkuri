import {
  BugIcon,
  CompassIcon,
  FlowerIcon,
  HomeIcon,
  PackageIcon,
  ScrollTextIcon,
  SettingsIcon,
  SproutIcon,
  WrenchIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { Fragment, useLayoutEffect, useRef, useState, type RefObject } from "react"

import { useOverflowingTabs } from "@/components/ui/tabs"
import { useI18n } from "@/i18n"
import type { UiKey } from "@/i18n/ui"
import type { PageId } from "@/lib/route"
import { cn } from "@/lib/utils"

export type NavItem = { id: PageId; label: UiKey; icon: LucideIcon; group: "home" | "tasks" | "more" }

// Home is a tab only in narrow windows; wide ones show it as the control panel beside every page.
export const NAV: NavItem[] = [
  { id: "home", label: "nav.home", icon: HomeIcon, group: "home" },
  { id: "gather", label: "nav.gather", icon: FlowerIcon, group: "tasks" },
  { id: "collect", label: "nav.collect", icon: PackageIcon, group: "tasks" },
  { id: "kill", label: "nav.kill", icon: BugIcon, group: "tasks" },
  { id: "boost", label: "nav.boost", icon: ZapIcon, group: "tasks" },
  { id: "quests", label: "nav.quests", icon: ScrollTextIcon, group: "tasks" },
  { id: "planters", label: "nav.planters", icon: SproutIcon, group: "tasks" },
  { id: "tools", label: "nav.tools", icon: WrenchIcon, group: "more" },
  { id: "settings", label: "nav.settings", icon: SettingsIcon, group: "more" },
  { id: "guide", label: "nav.guide", icon: CompassIcon, group: "more" },
]

/**
 * Where the current page's tab sits in the row, so one underline can slide between tabs.
 * Null until the row is laid out, so the underline appears in place instead of growing.
 */
function useActiveBox(list: RefObject<HTMLDivElement | null>, page: PageId, count: number) {
  const [box, setBox] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const measure = () => {
      const active = el.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active?.offsetWidth) return setBox(null)
      const next = { x: active.offsetLeft, w: active.offsetWidth }
      setBox((prev) => (prev && prev.x === next.x && prev.w === next.w ? prev : next))
    }
    measure()
    // tabs change width with the language, and their icons come and go with the window
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    el.querySelectorAll("a").forEach((a) => resize.observe(a))
    return () => resize.disconnect()
  }, [list, page, count])

  return box
}

/** The page tabs along the top of the window. They scroll sideways when the window is narrow. */
export function PageTabs({ page, items, className }: { page: PageId; items: NavItem[]; className?: string }) {
  const { t } = useI18n()
  const list = useRef<HTMLDivElement>(null)
  const mask = useOverflowingTabs(list)
  const box = useActiveBox(list, page, items.length)

  return (
    <nav aria-label={t("nav.label")} className={cn("@container min-w-0 flex-1 self-stretch", className)}>
      <div
        ref={list}
        className="relative flex h-full items-center gap-0.5 overflow-x-auto px-2 [scrollbar-width:none]"
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      >
        {items.map((item, i) => {
          const active = item.id === page
          return (
            <Fragment key={item.id}>
              {i > 0 && item.group !== items[i - 1].group && <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-border" />}
              <a
                href={`#/${item.id}`}
                aria-current={active ? "page" : undefined}
                // useOverflowingTabs scrolls the [data-state=active] tab into view
                data-state={active ? "active" : "inactive"}
                className="group/tab flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground data-[state=active]:text-foreground"
              >
                <item.icon aria-hidden className="hidden size-4 transition-colors group-data-[state=active]/tab:text-primary @3xl:block" />
                {t(item.label)}
              </a>
            </Fragment>
          )
        })}
        {box && (
          <span
            aria-hidden
            className="bk-glider pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-primary"
            style={{ transform: `translateX(${box.x + 8}px)`, width: box.w - 16 }}
          />
        )}
      </div>
    </nav>
  )
}
