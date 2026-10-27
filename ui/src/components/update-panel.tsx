import { DownloadIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/i18n"
import { usePythonEvent } from "@/lib/bridge"
import { callPy, callPyQuiet, isDesktopApp, py, RunState } from "@/lib/py"

type UpdateInfo = { available?: boolean; current_version?: string; latest_version?: string }

/** Version label, update button/progress, the "update available" prompt, and the install dialog. */
export function UpdatePanel({ iconOnly = false }: { iconOnly?: boolean }) {
  const { t } = useI18n()
  const [version, setVersion] = useState<string>("")
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null)
  const [offer, setOffer] = useState<UpdateInfo | null>(null)
  const [dontShow, setDontShow] = useState(false)
  // the update being installed; the macro restarts when it's done
  const [installing, setInstalling] = useState<{ info: UpdateInfo; auto: boolean } | null>(null)

  const install = (info: UpdateInfo, auto: boolean) => {
    setOffer(null)
    setInstalling({ info, auto })
    setProgress({ percent: 0, message: t("update.updating") })
    void callPyQuiet("update", auto)
  }

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
    // On launch: update by itself when auto update is on, otherwise offer it (unless opted out)
    const timer = setTimeout(async () => {
      if (!isDesktopApp()) return
      try {
        const [auto, offerDisabled] = await Promise.all([
          callPy<boolean>("getAutoUpdate"),
          callPy<boolean>("getAutoUpdateCheckDisabled"),
        ])
        if (!auto && offerDisabled) return
        const info = await callPy<UpdateInfo>("checkForUpdates")
        if (!info?.available) return
        // never interrupt a macro that is already running (Python checks again)
        if (auto && (await py.getRunState()) === RunState.Stopped) install(info, true)
        else if (!offerDisabled) setOffer(info)
      } catch (err) {
        console.error("update check failed", err)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  usePythonEvent("updateProgress", (percent: number, message: string) => {
    const text = message === "Restarting" ? t("update.restarting") : message || t("update.updating")
    setProgress({ percent: Math.max(0, Math.min(100, Number(percent) || 0)), message: text })
  })
  usePythonEvent("updateButtonReset", () => {
    setProgress(null)
    setInstalling(null)
  })

  const checkAndUpdate = async () => {
    setProgress({ percent: 0, message: t("update.checking") })
    const info = (await callPyQuiet("checkForUpdates")) as UpdateInfo | null
    if (info?.available) return install(info, false)
    setProgress(null)
    if (info) toast(t("update.latest"), { description: version })
    else toast.error(t("update.checkFailed"))
  }

  const label = progress ? (installing ? t("update.updating") : t("update.checking")) : t("update.check")

  return (
    <div className="space-y-2 px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:px-0">
      <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
        <span className="font-mono group-data-[collapsible=icon]:hidden">{version}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => void checkAndUpdate()}
              disabled={!!progress}
              aria-label={iconOnly ? label : undefined}
              className="group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 [&_svg]:transition-transform hover:[&_svg]:translate-y-px"
            >
              {progress ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
              <span className="group-data-[collapsible=icon]:hidden">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" hidden={!iconOnly}>
            {progress && installing ? `${label} · ${Math.round(progress.percent)}%` : `${label} · ${version}`}
          </TooltipContent>
        </Tooltip>
      </div>

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
            <AlertDialogAction onClick={() => offer && install(offer, false)}>{t("update.now")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Files are being replaced, so this can't be dismissed; the window closes and reopens when it's done. */}
      <AlertDialog open={!!installing}>
        <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("update.progressTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("update.progressDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2" aria-live="polite">
            <div className="font-mono text-sm">
              v{installing?.info.current_version ?? "?"} → v{installing?.info.latest_version ?? "?"}
            </div>
            <Progress value={progress?.percent ?? 0} />
            <div className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">{progress?.message}</span>
              <span className="tabular-nums">{Math.round(progress?.percent ?? 0)}%</span>
            </div>
          </div>
          {installing?.auto && <p className="text-xs text-muted-foreground">{t("update.autoNote")}</p>}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
