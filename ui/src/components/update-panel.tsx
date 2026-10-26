import { DownloadIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/i18n"
import { usePythonEvent } from "@/lib/bridge"
import { callPy, callPyQuiet, isDesktopApp } from "@/lib/py"

type UpdateInfo = { available?: boolean; current_version?: string; latest_version?: string }

/** Version label, update button/progress, and the "update available" prompt. */
export function UpdatePanel() {
  const { t } = useI18n()
  const [version, setVersion] = useState<string>("")
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null)
  const [offer, setOffer] = useState<UpdateInfo | null>(null)
  const [dontShow, setDontShow] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("./version.txt")
        let text = "v" + ((await res.text()).trim() || "?")
        const commit = await fetch("./updated_commit.txt").then((r) => (r.ok ? r.text() : ""))
        if (commit.trim() && !commit.trim().startsWith("<")) text += ` · ${commit.trim().slice(0, 7)}`
        setVersion(text)
      } catch {
        setVersion("v?")
      }
    })()
    // offer updates on launch unless the user opted out
    const timer = setTimeout(async () => {
      if (!isDesktopApp()) return
      try {
        if (await callPy<boolean>("getAutoUpdateCheckDisabled")) return
        const info = await callPy<UpdateInfo>("checkForUpdates")
        if (info?.available) setOffer(info)
      } catch (err) {
        console.error("update check failed", err)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  usePythonEvent("updateProgress", (percent: number, message: string) => {
    setProgress({ percent: Math.max(0, Math.min(100, Number(percent) || 0)), message: message || t("update.updating") })
  })
  usePythonEvent("updateButtonReset", () => setProgress(null))

  const runUpdate = () => {
    setProgress({ percent: 0, message: t("update.updating") })
    void callPyQuiet("update")
  }

  return (
    <div className="space-y-2 px-2 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono">{version}</span>
        <Button variant="ghost" size="xs" onClick={runUpdate} disabled={!!progress}>
          {progress ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
          {progress ? t("update.updating") : t("update.check")}
        </Button>
      </div>
      {progress && (
        <div className="space-y-1" aria-live="polite">
          <div className="flex justify-between">
            <span className="truncate">{progress.message}</span>
            <span className="tabular-nums">{Math.round(progress.percent)}%</span>
          </div>
          <Progress value={progress.percent} />
        </div>
      )}

      <AlertDialog open={!!offer} onOpenChange={(open) => !open && setOffer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("update.available")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("update.availableDesc", { current: offer?.current_version ?? "?", latest: offer?.latest_version ?? "?" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Checkbox id="update-dont-show" checked={dontShow} onCheckedChange={(v) => setDontShow(v === true)} />
            <Label htmlFor="update-dont-show">{t("update.dontShow")}</Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (dontShow) void callPyQuiet("disableAutoUpdateCheck")
              }}
            >
              {t("common.close")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={runUpdate}>{t("update.now")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
