import { AlertTriangleIcon, CheckCircle2Icon, DownloadIcon, Loader2Icon } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"

import { modelStem, type ModelInfo } from "./data"
import { strings } from "./strings"

type DownloadResult = { ok?: boolean; message?: string; failures?: unknown }

/** Shows whether the detection models an AI pattern needs are installed, with a download button. */
export function ModelStatus({ required }: { required: string[] }) {
  const ts = useStrings(strings)
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await callPy<{ models?: ModelInfo[] }>("getModelStatus")
      setModels(Array.isArray(result?.models) ? result.models : [])
      setFailed(false)
    } catch (err) {
      console.error("[gather] getModelStatus", err)
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (failed) return <StatusBox tone="warn" text={ts("modelsUnknown")} />
  if (!models) return <StatusBox tone="muted" text={ts("modelsChecking")} busy />

  // A model counts as present when any format of it (Core ML / ONNX) is installed.
  const wanted = new Set(required)
  const relevant = models.filter((m) => wanted.has(modelStem(m.name)))
  if (relevant.length === 0) return null
  const installedStems = new Set(relevant.filter((m) => m.installed).map((m) => modelStem(m.name)))
  const missing = relevant.filter((m) => !m.installed && !installedStems.has(modelStem(m.name)))

  if (missing.length === 0) return <StatusBox tone="ok" text={ts("modelsReady")} />

  const download = async () => {
    setDownloading(true)
    try {
      const result = await callPy<DownloadResult>("downloadMissingModels", missing.map((m) => m.name))
      if (result?.ok) toast.success(ts("modelsDownloaded"))
      else toast.error(result?.failures ? ts("modelsDownloadFailed") : (result?.message ?? ts("modelsDownloadFailed")))
    } catch (err) {
      console.error("[gather] downloadMissingModels", err)
      toast.error(ts("modelsDownloadFailed"))
    } finally {
      setDownloading(false)
      void load()
    }
  }

  return (
    <StatusBox tone="warn" text={downloading ? ts("modelsDownloading") : ts("modelsMissing", { count: missing.length })} busy={downloading}>
      <Button size="sm" onClick={download} disabled={downloading}>
        {downloading ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
        {ts("modelsDownload")}
      </Button>
    </StatusBox>
  )
}

function StatusBox({
  tone,
  text,
  busy,
  children,
}: {
  tone: "ok" | "warn" | "muted"
  text: string
  busy?: boolean
  children?: ReactNode
}) {
  const Icon = busy ? Loader2Icon : tone === "ok" ? CheckCircle2Icon : AlertTriangleIcon
  return (
    <div
      className={cn(
        "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm",
        tone === "ok" && "border-emerald-500/30 bg-emerald-500/5",
        tone === "warn" && "border-amber-500/40 bg-amber-500/10",
        tone === "muted" && "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon
          className={cn(
            "size-4 shrink-0",
            busy && "animate-spin",
            tone === "ok" && "text-emerald-600 dark:text-emerald-400",
            tone === "warn" && "text-amber-600 dark:text-amber-400",
          )}
        />
        {text}
      </span>
      {children}
    </div>
  )
}
