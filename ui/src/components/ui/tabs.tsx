"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-4 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px] text-muted-foreground [scrollbar-width:none] group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const EDGE_FADE = 24

/**
 * When the tab row is wider than the page it scrolls sideways (scrollbar hidden), so
 * keep the active tab in view and fade whichever edge has more tabs behind it.
 */
function useOverflowingTabs(list: React.RefObject<HTMLDivElement | null>) {
  const [mask, setMask] = React.useState<string | undefined>()

  React.useEffect(() => {
    const el = list.current
    if (!el) return
    const update = () => {
      const left = el.scrollLeft > 1
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      setMask(
        left || right
          ? `linear-gradient(to right, ${left ? "transparent" : "black"}, black ${EDGE_FADE}px, black calc(100% - ${EDGE_FADE}px), ${right ? "transparent" : "black"})`
          : undefined
      )
    }
    const reveal = (behavior: ScrollBehavior) => {
      const active = el.querySelector<HTMLElement>('[data-state="active"]')
      if (!active || el.scrollWidth <= el.clientWidth) return
      const a = active.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      if (a.left < b.left + EDGE_FADE) el.scrollBy({ left: a.left - b.left - EDGE_FADE, behavior })
      else if (a.right > b.right - EDGE_FADE) el.scrollBy({ left: a.right - b.right + EDGE_FADE, behavior })
    }
    reveal("instant")
    update()
    const resize = new ResizeObserver(update)
    resize.observe(el)
    const tabs = new MutationObserver(() => reveal("smooth"))
    tabs.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"] })
    el.addEventListener("scroll", update, { passive: true })
    return () => {
      resize.disconnect()
      tabs.disconnect()
      el.removeEventListener("scroll", update)
    }
  }, [list])

  return mask
}

function TabsList({
  className,
  variant = "default",
  ref,
  style,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const local = React.useRef<HTMLDivElement | null>(null)
  const mask = useOverflowingTabs(local)
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      local.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  return (
    <TabsPrimitive.List
      ref={setRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask, ...style } : style}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
