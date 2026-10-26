import { BotIcon, ClipboardCopyIcon, ClipboardPasteIcon, HandIcon, PauseCircleIcon, PowerOffIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Page, PageLoading } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useI18n, useStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { AutoPlanters } from "./planters/auto"
import { ManualPlanters } from "./planters/manual"
import { strings } from "./planters/strings"

const MODES = [
  { value: 0, key: "off", Icon: PowerOffIcon },
  { value: 1, key: "manual", Icon: HandIcon },
  { value: 2, key: "auto", Icon: BotIcon },
] as const

function ModePicker({ mode, onChange }: { mode: number; onChange: (mode: number) => void }) {
  const t = useStrings(strings)
  return (
    <div role="radiogroup" aria-label={t("mode")} className="grid gap-2 sm:grid-cols-3">
      {MODES.map(({ value, key, Icon }) => {
        const on = mode === value
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(value)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
              on ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-card hover:bg-accent",
            )}
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              <Icon className="size-5" />
            </span>
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold">{t(`mode.${key}`)}</span>
              <span className="block text-xs text-muted-foreground">{t(`mode.${key}.desc`)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ImportExport() {
  const t = useStrings(strings)
  const { t: tc } = useI18n()
  const { refresh } = useSettings()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)

  const exportSettings = async () => {
    try {
      const json = await callPy<string | null>("exportPlanterSettings")
      if (!json) throw new Error("empty")
      await navigator.clipboard.writeText(json)
      let detail: string | undefined
      try {
        const meta = JSON.parse(json)?.metadata ?? {}
        if (meta.macro_version)
          detail = t("exportedDetail", {
            version: meta.macro_version,
            date: meta.export_date ? new Date(meta.export_date).toLocaleString() : "-",
          })
      } catch {
        // metadata is optional
      }
      toast.success(t("exported"), { description: detail })
    } catch (err) {
      console.error("exportPlanterSettings", err)
      toast.error(t("exportFailed"))
    }
  }

  const importSettings = async () => {
    const json = text.trim()
    if (!json) {
      toast.error(t("importEmpty"))
      return
    }
    setBusy(true)
    try {
      const result = await callPy<{ success?: boolean; macro_version?: string; imported_settings_count?: number } | false>("importPlanterSettings", json)
      if (!result || !result.success) throw new Error("import failed")
      await refresh()
      setOpen(false)
      toast.success(t("imported"), {
        description: t("importedDetail", {
          count: result.imported_settings_count ?? 0,
          version: result.macro_version && result.macro_version !== "unknown" ? result.macro_version : "-",
        }),
      })
    } catch (err) {
      console.error("importPlanterSettings", err)
      toast.error(t("importFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={exportSettings}>
        <ClipboardCopyIcon />
        {t("export")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setText("")
          setOpen(true)
        }}
      >
        <ClipboardPasteIcon />
        {t("import")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
            <DialogDescription>{t("importDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("importPlaceholder")}
            className="h-48 font-mono text-xs"
            spellCheck={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc("common.cancel")}
            </Button>
            <Button onClick={importSettings} disabled={busy}>
              {t("import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function PlantersPage() {
  const t = useStrings(strings)
  const { t: tc } = useI18n()
  const { settings, saveProfile } = useSettings()
  if (!settings) return <PageLoading />

  const mode = Math.min(2, Math.max(0, Number(settings.planters_mode ?? 0) || 0))

  return (
    <Page title={tc("nav.planters")} description={t("subtitle")} actions={<ImportExport />}>
      {/* the old range slider saved its value as a string ("0" / "1" / "2") */}
      <ModePicker mode={mode} onChange={(m) => void saveProfile("planters_mode", String(m))} />

      {mode === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PauseCircleIcon className="size-14 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">{t("offTitle")}</h2>
            <p className="max-w-md text-sm text-muted-foreground">{t("offDesc")}</p>
          </CardContent>
        </Card>
      )}
      {mode === 1 && <ManualPlanters />}
      {mode === 2 && <AutoPlanters />}
    </Page>
  )
}
