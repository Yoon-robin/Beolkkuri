import { CpuIcon, DownloadIcon, FlaskConicalIcon, Loader2Icon, ServerIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { isMac } from "@/lib/platform"
import { callPy, py } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { ConfirmDialog, CustomRow, base64ToBlob, downloadBlob } from "./shared"

const computer = isMac ? "Mac" : "PC"

const strings: PageStrings<
  | "fallback.button"
  | "fallback.title"
  | "fallback.desc"
  | "fallback.server"
  | "fallback.placeholder"
  | "fallback.save"
  | "fallback.saved"
  | "theme.title"
  | "theme.desc"
  | "theme.row"
  | "theme.rowDesc"
  | "beta.placeholder"
  | "beta.button"
  | "beta.invalid"
  | "beta.confirmTitle"
  | "beta.confirmDesc"
  | "beta.starting"
  | "beta.failed"
  | "beta.error"
  | "debug.button"
  | "debug.working"
  | "debug.done"
  | "debug.failed"
  | "models.title"
  | "models.desc"
  | "models.checking"
  | "models.allInstalled"
  | "models.missingCount"
  | "models.unavailable"
  | "models.downloadAll"
  | "models.download"
  | "models.downloading"
  | "models.done"
  | "models.someFailed"
  | "models.failed"
  | "models.installed"
  | "models.missing"
  | "models.group.Standard"
  | "models.group.Small"
  | "models.group.Mini"
  | "models.group.Other"
  | "models.token"
  | "models.sprinkler"
  | "models.loot"
  | "models.bloom"
  | "models.other"
  | "models.none"
> = {
  ko: {
    "fallback.button": "서버 관리",
    "fallback.title": "예비 비공개 서버",
    "fallback.desc": "기본 비공개 서버에 들어가지 못하면 여기 적은 서버를 순서대로 시도해요. 안 쓰는 칸은 비워 두세요.",
    "fallback.server": "예비 서버 {n}",
    "fallback.placeholder": "비공개 서버 링크",
    "fallback.save": "저장",
    "fallback.saved": "예비 서버를 저장했어요.",
    "theme.title": "리포트 색상",
    "theme.desc": "시간별·세션 리포트 이미지의 색상이에요. 앱 화면 색은 바뀌지 않아요.",
    "theme.row": "리포트 색상 테마",
    "theme.rowDesc": "디스코드로 보내는 리포트 이미지에 이 색이 쓰여요.",
    "beta.placeholder": "7자리 코드",
    "beta.button": "테스트 업데이트",
    "beta.invalid": "7자리 코드(숫자와 a~f)를 정확히 입력해 주세요.",
    "beta.confirmTitle": "{hash} 버전으로 업데이트할까요?",
    "beta.confirmDesc": "지금 파일을 백업한 뒤 새 파일을 적용해요. 적용하는 동안 앱이 닫힐 수 있어요.",
    "beta.starting": "{hash} 버전으로 업데이트를 시작해요",
    "beta.failed": "업데이트하지 못했어요. 기록을 확인해 주세요.",
    "beta.error": "업데이트를 시작하지 못했어요: {message}",
    "debug.button": "디버그 파일 저장",
    "debug.working": "디버그 파일을 만드는 중…",
    "debug.done": "{file} 파일로 저장했어요.",
    "debug.failed": "디버그 파일을 만들지 못했어요: {message}",
    "models.title": "AI 모델",
    "models.desc": `이 ${computer}에 없는 AI 모델만 골라서 내려받아요.`,
    "models.checking": "설치된 모델을 확인하는 중…",
    "models.allInstalled": "필요한 모델이 모두 설치돼 있어요.",
    "models.missingCount": "모델 {count}개가 없어요.",
    "models.unavailable": "설치된 모델을 확인하지 못했어요.",
    "models.downloadAll": "없는 모델 모두 받기",
    "models.download": "받기",
    "models.downloading": "모델을 받는 중이에요. 몇 분 걸릴 수 있어요.",
    "models.done": "모델을 다 받았어요.",
    "models.someFailed": "일부 모델을 받지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
    "models.failed": "모델을 받지 못했어요: {message}",
    "models.installed": "설치됨",
    "models.missing": "없음",
    "models.group.Standard": "표준 모델",
    "models.group.Small": "라이트 모델",
    "models.group.Mini": "미니 모델",
    "models.group.Other": "기타 모델",
    "models.token": "토큰 인식",
    "models.sprinkler": "스프링클러 인식",
    "models.loot": "전리품 인식",
    "models.bloom": "블룸 인식",
    "models.other": "AI 모델",
    "models.none": `이 ${computer}에서 쓸 수 있는 모델이 없어요.`,
  },
  en: {
    "fallback.button": "Manage servers",
    "fallback.title": "Fallback private servers",
    "fallback.desc": "If the main private server fails, the macro tries these in order. Leave a box empty to skip it.",
    "fallback.server": "Backup server {n}",
    "fallback.placeholder": "Private server link",
    "fallback.save": "Save",
    "fallback.saved": "Fallback servers saved.",
    "theme.title": "Report colours",
    "theme.desc": "Colours used for the hourly and session report images. This doesn't change the app's own colours.",
    "theme.row": "Report colour theme",
    "theme.rowDesc": "Used for the report images sent to Discord.",
    "beta.placeholder": "7-character code",
    "beta.button": "Test update",
    "beta.invalid": "Please enter a valid 7-character code (0-9, a-f).",
    "beta.confirmTitle": "Update to {hash}?",
    "beta.confirmDesc": "Your current files are backed up first, then the update is applied. The app may close while it updates.",
    "beta.starting": "Starting update to {hash}",
    "beta.failed": "The update failed or was cancelled. Check the logs for details.",
    "beta.error": "Couldn't start the update: {message}",
    "debug.button": "Export debug folder",
    "debug.working": "Creating debug file…",
    "debug.done": "Saved as {file}.",
    "debug.failed": "Couldn't export the debug folder: {message}",
    "models.title": "AI models",
    "models.desc": `Download only the AI models that are missing from this ${computer}.`,
    "models.checking": "Checking installed models…",
    "models.allInstalled": "All supported models are installed.",
    "models.missingCount": "{count} model(s) missing.",
    "models.unavailable": "Couldn't check installed models.",
    "models.downloadAll": "Download missing models",
    "models.download": "Download",
    "models.downloading": "Downloading models… This can take a few minutes.",
    "models.done": "Model download complete.",
    "models.someFailed": "Some models couldn't be downloaded. Check your internet connection and try again.",
    "models.failed": "Couldn't download models: {message}",
    "models.installed": "Installed",
    "models.missing": "Missing",
    "models.group.Standard": "Standard models",
    "models.group.Small": "Light models",
    "models.group.Mini": "Mini models",
    "models.group.Other": "Other models",
    "models.token": "Token detection",
    "models.sprinkler": "Sprinkler detection",
    "models.loot": "Loot detection",
    "models.bloom": "Bloom detection",
    "models.other": "AI model",
    "models.none": `No models are available for this ${computer}.`,
  },
}

/* ------------------------------------------------------------------ */
/* Fallback private servers                                            */
/* ------------------------------------------------------------------ */

const FALLBACK_KEYS = ["fallback_private_server_link_1", "fallback_private_server_link_2", "fallback_private_server_link_3"] as const

export function FallbackServersButton() {
  const t = useStrings(strings)
  const { t: tc } = useI18n()
  const { saveGeneral } = useSettings()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<string[]>(["", "", ""])

  const openDialog = async () => {
    try {
      const s = await py.loadAllSettings()
      setValues(FALLBACK_KEYS.map((k) => String(s?.[k] ?? "")))
    } catch (err) {
      console.error("[settings] loadAllSettings", err)
    }
    setOpen(true)
  }

  const save = async () => {
    for (const [i, key] of FALLBACK_KEYS.entries()) await saveGeneral(key, values[i])
    setOpen(false)
    toast.success(t("fallback.saved"))
  }

  return (
    <>
      <Button variant="secondary" onClick={() => void openDialog()}>
        <ServerIcon />
        {t("fallback.button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("fallback.title")}</DialogTitle>
            <DialogDescription>{t("fallback.desc")}</DialogDescription>
          </DialogHeader>
          <form
            id="fallback-servers-form"
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            {FALLBACK_KEYS.map((key, i) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{t("fallback.server", { n: i + 1 })}</Label>
                <Input
                  id={key}
                  value={values[i]}
                  placeholder={t("fallback.placeholder")}
                  onChange={(e) => setValues((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc("common.cancel")}
            </Button>
            <Button type="submit" form="fallback-servers-form">
              {t("fallback.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Report colour theme (gui_theme)                                     */
/* ------------------------------------------------------------------ */

// Values are what the old dropdown saved (lower-cased); the report renderer maps them to colours.
const THEMES: { value: string; color: string; ko: string; en: string }[] = [
  { value: "brown", color: "#ab8062", ko: "갈색", en: "Brown" },
  { value: "cream", color: "#efda98", ko: "크림색", en: "Cream" },
  { value: "red", color: "#cb4144", ko: "프리사이스", en: "Precise" },
  { value: "blue", color: "#3fc1c3", ko: "부이언트", en: "Buoyant" },
  { value: "commander", color: "#5ad172", ko: "커맨더", en: "Commander" },
  { value: "purple", color: "#9d8ec3", ko: "신화", en: "Mythic" },
  { value: "basic black", color: "#ffc800", ko: "베이직 비", en: "Basic Bee" },
  { value: "gummy", color: "#ff00ff", ko: "구미", en: "Gummy" },
  { value: "tadpole", color: "#20bd96", ko: "올챙이", en: "Tadpole" },
  { value: "gifted tad", color: "#90f0e0", ko: "기프티드 올챙이", en: "Gifted Tad" },
  { value: "spicy bee", color: "#cf2013", ko: "스파이시 비", en: "Spicy Bee" },
]

function ThemeOption({ theme, lang }: { theme: (typeof THEMES)[number]; lang: "ko" | "en" }) {
  return (
    <span className="flex items-center gap-2">
      <span className="size-3.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: theme.color }} />
      {theme[lang]}
    </span>
  )
}

export function ReportThemeCard() {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveGeneral } = useSettings()
  // the report renderer falls back to brown when nothing is saved
  const current = String(settings?.gui_theme || "brown").toLowerCase()
  const selected = THEMES.find((th) => th.value === current)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("theme.title")}</CardTitle>
        <CardDescription>{t("theme.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <CustomRow htmlFor="gui_theme" title={t("theme.row")} desc={t("theme.rowDesc")}>
          <Select value={selected?.value ?? ""} onValueChange={(v) => void saveGeneral("gui_theme", v)}>
            <SelectTrigger id="gui_theme" className="min-w-44">
              <SelectValue placeholder="—">{selected ? <ThemeOption theme={selected} lang={lang} /> : null}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {THEMES.map((th) => (
                <SelectItem key={th.value} value={th.value}>
                  <ThemeOption theme={th} lang={lang} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CustomRow>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Beta update from a commit hash                                      */
/* ------------------------------------------------------------------ */

export function BetaUpdateControl() {
  const t = useStrings(strings)
  const [hash, setHash] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [running, setRunning] = useState(false)

  const ask = () => {
    if (!/^[0-9a-fA-F]{7}$/.test(hash.trim())) return toast.error(t("beta.invalid"))
    setConfirming(true)
  }

  const start = async () => {
    const code = hash.trim()
    setRunning(true)
    // show progress in the sidebar update panel, like the old window.updateProgress call
    window.__beolkkuriBridge?.handlers.updateProgress?.(...([0, t("beta.starting", { hash: code })] as never[]))
    try {
      const res = await callPy("updateFromHash", code)
      if (!res) toast.error(t("beta.failed"))
    } catch (err) {
      console.error("[settings] updateFromHash", err)
      toast.error(t("beta.error", { message: String(err) }))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id="beta_commit_hash"
        value={hash}
        maxLength={7}
        placeholder={t("beta.placeholder")}
        onChange={(e) => setHash(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && ask()}
        className="w-32 font-mono"
        autoComplete="off"
        spellCheck={false}
      />
      <Button variant="secondary" onClick={ask} disabled={running}>
        {running ? <Loader2Icon className="animate-spin" /> : <FlaskConicalIcon />}
        {t("beta.button")}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("beta.confirmTitle", { hash: hash.trim() })}
        description={t("beta.confirmDesc")}
        confirmLabel={t("beta.button")}
        onConfirm={() => void start()}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Debug zip export                                                    */
/* ------------------------------------------------------------------ */

export function useDebugExport() {
  const t = useStrings(strings)
  return useCallback(async () => {
    const id = toast.loading(t("debug.working"))
    try {
      const current = await py.getCurrentProfile()
      const res = await callPy<[boolean, string, string?]>("exportDebugZip", current)
      if (!Array.isArray(res) || res[0] !== true) {
        toast.error(t("debug.failed", { message: String(Array.isArray(res) ? res[1] : res) }), { id })
        return
      }
      const filename = res[2] || "beolkkuri_debug.zip"
      downloadBlob(base64ToBlob(res[1], "application/zip"), filename)
      toast.success(t("debug.done", { file: filename }), { id })
    } catch (err) {
      console.error("[settings] exportDebugZip", err)
      toast.error(t("debug.failed", { message: String(err) }), { id })
    }
  }, [t])
}

/* ------------------------------------------------------------------ */
/* AI model downloads                                                  */
/* ------------------------------------------------------------------ */

type ModelInfo = { name: string; installed: boolean; size_bytes?: number }

const MODEL_PRESENTATION: Record<string, { group: "Standard" | "Small" | "Mini"; label: "token" | "sprinkler" | "loot" | "bloom" }> = {
  "token_detection_standard.mlmodelc": { group: "Standard", label: "token" },
  "sprinkler_detection_standard.mlmodelc": { group: "Standard", label: "sprinkler" },
  "token_detection_small.mlmodelc": { group: "Small", label: "token" },
  "loot_detection_small.mlmodelc": { group: "Small", label: "loot" },
  "token_detection_mini.mlmodelc": { group: "Mini", label: "token" },
  "loot_detection_mini.mlmodelc": { group: "Mini", label: "loot" },
  "bloom_detection_standard.mlmodelc": { group: "Standard", label: "bloom" },
  "bloom_detection_light.mlmodelc": { group: "Small", label: "bloom" },
  "bloom_detection_mini.mlmodelc": { group: "Mini", label: "bloom" },
  "token_detection_standard.onnx": { group: "Standard", label: "token" },
  "sprinkler_detection_standard.onnx": { group: "Standard", label: "sprinkler" },
  "bloom_detection_standard.onnx": { group: "Standard", label: "bloom" },
  "bloom_detection_light.onnx": { group: "Small", label: "bloom" },
  "bloom_detection_mini.onnx": { group: "Mini", label: "bloom" },
}
const GROUP_ORDER = ["Standard", "Small", "Mini", "Other"] as const

const formatSize = (bytes?: number) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : "")

export function ModelsCard() {
  const t = useStrings(strings)
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await callPy<{ models?: ModelInfo[] } | null>("getModelStatus")
      setModels(Array.isArray(res?.models) ? res.models : [])
      setError(false)
    } catch (err) {
      console.error("[settings] getModelStatus", err)
      setError(true)
      setModels([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const download = async (names: string[] | null) => {
    setDownloading(true)
    setStatus({ text: t("models.downloading") })
    try {
      const res = await callPy<{ ok?: boolean; message?: string; failures?: unknown } | null>("downloadMissingModels", names)
      if (!res?.ok) {
        setStatus({ text: res?.failures ? t("models.someFailed") : t("models.failed", { message: res?.message ?? "" }), error: true })
        return
      }
      setStatus({ text: t("models.done") })
      await load()
    } catch (err) {
      console.error("[settings] downloadMissingModels", err)
      setStatus({ text: t("models.failed", { message: String(err) }), error: true })
    } finally {
      setDownloading(false)
    }
  }

  const missing = (models ?? []).filter((m) => !m.installed).length
  const summary = models === null ? t("models.checking") : error ? t("models.unavailable") : models.length === 0 ? t("models.none") : missing ? t("models.missingCount", { count: missing }) : t("models.allInstalled")

  const grouped = new Map<string, (ModelInfo & { label: string })[]>()
  for (const m of models ?? []) {
    const p = MODEL_PRESENTATION[m.name]
    const group = p?.group ?? "Other"
    const list = grouped.get(group) ?? []
    list.push({ ...m, label: t(p ? `models.${p.label}` : "models.other") })
    grouped.set(group, list)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CpuIcon className="size-4" />
          {t("models.title")}
          {models !== null && models.length > 0 && !error && (
            <Badge variant={missing ? "destructive" : "secondary"}>{missing ? t("models.missingCount", { count: missing }) : t("models.installed")}</Badge>
          )}
        </CardTitle>
        <CardDescription>{t("models.desc")}</CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => void download(null)} disabled={downloading || models === null || (!error && missing === 0)}>
            {downloading ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
            {t("models.downloadAll")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("text-sm", status?.error || error ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
          {status?.text ?? summary}
        </p>
        {GROUP_ORDER.filter((g) => grouped.get(g)?.length).map((group) => (
          <section key={group} className="space-y-1.5">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`models.group.${group}`)}</h3>
            <ul className="divide-y rounded-lg border">
              {grouped.get(group)!.map((m) => (
                <li key={m.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{m.label}</p>
                    <p className={cn("text-xs", m.installed ? "text-muted-foreground" : "text-destructive")}>
                      {m.installed ? [t("models.installed"), formatSize(m.size_bytes)].filter(Boolean).join(" · ") : t("models.missing")}
                    </p>
                  </div>
                  {!m.installed && (
                    <Button size="sm" variant="secondary" disabled={downloading} onClick={() => void download([m.name])}>
                      <DownloadIcon />
                      {t("models.download")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}
