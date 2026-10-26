// Small pieces shared by the Collect, Kill and Quests pages.
import { ZoomInIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function readStored(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable: the tab just won't be remembered
  }
}

export type SubTab = { value: string; label: ReactNode; content: ReactNode }

/**
 * Sub-tabs that remember the last one opened, under the same localStorage key
 * the old UI used (e.g. "activeKillSubtab" -> "kill-boss").
 */
export function SubTabs({ storageKey, fallback, tabs }: { storageKey: string; fallback: string; tabs: SubTab[] }) {
  const [active, setActive] = useState(() => {
    const saved = readStored(storageKey)
    return saved && tabs.some((t) => t.value === saved) ? saved : fallback
  })
  const change = (value: string) => {
    setActive(value)
    writeStored(storageKey, value)
  }
  return (
    <Tabs value={active} onValueChange={change} className="gap-4">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList className="h-9">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-3">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className="grid gap-4">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Cheat-sheet image that opens full size when clicked. */
export function ZoomableImage({ src, alt, hint }: { src: string; alt: string; hint: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full max-w-[600px] cursor-zoom-in overflow-hidden rounded-lg border shadow-sm"
      >
        <img src={src} alt={alt} className="h-auto w-full" draggable={false} />
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs opacity-0 shadow transition-opacity group-hover:opacity-100">
          <ZoomInIcon className="size-3.5" />
          {hint}
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-auto p-2 sm:max-w-[min(95vw,1400px)]">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt} className="h-auto w-full rounded-md" draggable={false} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
