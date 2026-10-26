import { ClipboardCopyIcon, ClipboardPasteIcon, Loader2Icon, RotateCcwIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useI18n, useStrings } from "@/i18n"
import { fieldLabel } from "@/lib/game-data"
import { callPy } from "@/lib/py"
import { useSettings } from "@/state/settings"

import { strings } from "./strings"

type ImportResult = {
  success?: boolean
  imported_from_field?: string
  macro_version?: string
  missing_patterns?: string[]
  warnings?: string[]
}

/** Export / import / reset for the selected field (old bottom button row). */
export function FieldTools({ field }: { field: string }) {
  const { t, lang } = useI18n()
  const ts = useStrings(strings)
  const { refresh } = useSettings()
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [manualCopy, setManualCopy] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const name = field ? fieldLabel(field, lang) : ""

  const requireField = () => {
    if (!field) toast.error(ts("needField"))
    return Boolean(field)
  }

  const exportSettings = async () => {
    if (!requireField()) return
    try {
      const json = await callPy<string | null>("exportFieldSettings", field)
      if (!json) {
        toast.error(ts("exportFailed"))
        return
      }
      let meta: { macro_version?: string; export_date?: string } = {}
      try {
        meta = JSON.parse(json)?.metadata ?? {}
      } catch {
        // metadata is optional
      }
      const description = meta.macro_version
        ? ts("exportMeta", {
            version: meta.macro_version,
            date: meta.export_date ? new Date(meta.export_date).toLocaleString(lang === "ko" ? "ko-KR" : undefined) : "",
          })
        : undefined
      try {
        await navigator.clipboard.writeText(json)
        toast.success(ts("exportDone", { field: name }), { description })
      } catch {
        // clipboard blocked: let the user copy it by hand
        setManualCopy(json)
      }
    } catch (err) {
      console.error("[gather] exportFieldSettings", err)
      toast.error(ts("exportFailed"))
    }
  }

  const importSettings = async () => {
    const json = importText.trim()
    if (!json) {
      toast.error(ts("importEmpty"))
      return
    }
    setBusy(true)
    try {
      const result = await callPy<ImportResult | false | null>("importFieldSettings", field, json)
      if (!result || !result.success) {
        toast.error(ts("importFailed"))
        return
      }
      await refresh()
      setImportOpen(false)
      const lines: string[] = []
      if (result.imported_from_field && result.imported_from_field !== "unknown") lines.push(ts("importFrom", { field: result.imported_from_field }))
      if (result.macro_version && result.macro_version !== "unknown") lines.push(ts("importVersion", { version: result.macro_version }))
      if (result.missing_patterns?.length) lines.push(ts("importReplaced", { list: result.missing_patterns.join(", ") }))
      if (result.warnings?.length) lines.push(ts("importWarnings", { list: result.warnings.join("\n") }))
      const warn = Boolean(result.missing_patterns?.length || result.warnings?.length)
      ;(warn ? toast.warning : toast.success)(ts("importDone", { field: name }), {
        description: lines.length ? <span className="whitespace-pre-line">{lines.join("\n")}</span> : undefined,
        duration: warn ? 12000 : undefined,
      })
    } catch (err) {
      console.error("[gather] importFieldSettings", err)
      toast.error(ts("importFailed"))
    } finally {
      setBusy(false)
    }
  }

  const resetField = async () => {
    setBusy(true)
    try {
      const ok = await callPy<boolean>("resetFieldToDefault", field)
      if (ok) {
        await refresh()
        toast.success(ts("resetDone", { field: name }))
      } else {
        toast.error(ts("resetFailed", { field: name }))
      }
    } catch (err) {
      console.error("[gather] resetFieldToDefault", err)
      toast.error(ts("resetFailed", { field: name }))
    } finally {
      setBusy(false)
      setResetOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{ts("toolsTitle")}</CardTitle>
        <CardDescription>{ts("toolsDesc", { field: name || "—" })}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportSettings} disabled={!field}>
          <ClipboardCopyIcon />
          {ts("export")}
        </Button>
        <Button
          variant="outline"
          disabled={!field}
          onClick={() => {
            if (!requireField()) return
            setImportText("")
            setImportOpen(true)
          }}
        >
          <ClipboardPasteIcon />
          {ts("import")}
        </Button>
        <Button variant="destructive" disabled={!field} onClick={() => requireField() && setResetOpen(true)}>
          <RotateCcwIcon />
          {ts("reset")}
        </Button>
      </CardContent>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ts("importTitle", { field: name })}</DialogTitle>
            <DialogDescription>{ts("importDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={ts("importPlaceholder")}
            className="h-48 font-mono text-xs"
            spellCheck={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={importSettings} disabled={busy}>
              {busy && <Loader2Icon className="animate-spin" />}
              {t("common.import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualCopy !== null} onOpenChange={(o) => !o && setManualCopy(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{ts("export")}</DialogTitle>
            <DialogDescription>{name}</DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={manualCopy ?? ""} className="h-48 font-mono text-xs" onFocus={(e) => e.target.select()} />
          <DialogFooter>
            <Button onClick={() => setManualCopy(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ts("resetTitle", { field: name })}</AlertDialogTitle>
            <AlertDialogDescription>{ts("resetDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault()
                void resetField()
              }}
              disabled={busy}
            >
              {t("common.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
