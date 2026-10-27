import { FileUpIcon, InfoIcon, Loader2Icon, SparklesIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { toast } from "sonner"

import { Page, PageLoading } from "@/components/page"
import { SchemaSection, SettingControl, type Binding, type SectionOverrides } from "@/components/settings/schema-section"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n, useStrings } from "@/i18n"
import { FIELD_EMOJI, FIELD_KO, fieldKey, fieldLabel, titleCase } from "@/lib/game-data"
import { callPy, type FieldSettings } from "@/lib/py"
import { cn } from "@/lib/utils"
import { sectionsFor, type SectionDef, type SettingDef } from "@/schema"
import { useSettings } from "@/state/settings"

import {
  BLOOMS_AI_PATTERN,
  FALLBACK_AI_PRESETS,
  FIELD_OPTIONS,
  ROBIN_AI_PATTERN,
  SLOT_COUNT,
  applyPatternChange,
  clampGooInterval,
  normalizeFieldData,
  normalizePatterns,
  rememberPreset,
  requiredModels,
  robinAIModelName,
  type PatternInfo,
} from "./gather/data"
import { FieldTools } from "./gather/field-tools"
import { ModelStatus } from "./gather/model-status"
import { strings } from "./gather/strings"
import { TokenDialog } from "./gather/token-dialog"

const SLOT_STORAGE_KEY = "robinmacro_gather_slot"

function readSlot() {
  try {
    const n = Number(localStorage.getItem(SLOT_STORAGE_KEY))
    return Number.isInteger(n) && n >= 0 && n < SLOT_COUNT ? n : 0
  } catch {
    return 0
  }
}

function writeSlot(n: number) {
  try {
    localStorage.setItem(SLOT_STORAGE_KEY, String(n))
  } catch {
    // storage unavailable
  }
}

const sectionByTitle = (title: string) => sectionsFor("gather").find((s) => s.title === title)

function usePatterns() {
  const [patterns, setPatterns] = useState<PatternInfo[] | null>(null)
  const reload = useCallback(async () => {
    try {
      setPatterns(normalizePatterns(await callPy("getPatterns")))
    } catch (err) {
      console.error("[gather] getPatterns", err)
      setPatterns([])
    }
  }, [])
  useEffect(() => {
    void reload()
  }, [reload])
  return { patterns, reload }
}

/** Default AI pattern presets come from Python so they match what the backend builds. */
function useAIDefaults() {
  const [defaults, setDefaults] = useState<Record<string, FieldSettings>>(FALLBACK_AI_PRESETS)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      callPy<FieldSettings>("getDefaultRobinAIGatherPatternPreset").catch(() => null),
      callPy<FieldSettings>("getDefaultBloomsAIPatternPreset").catch(() => null),
    ]).then(([robin, blooms]) => {
      if (cancelled) return
      setDefaults({
        [ROBIN_AI_PATTERN]: robin && typeof robin === "object" ? robin : FALLBACK_AI_PRESETS[ROBIN_AI_PATTERN],
        [BLOOMS_AI_PATTERN]: blooms && typeof blooms === "object" ? blooms : FALLBACK_AI_PRESETS[BLOOMS_AI_PATTERN],
      })
    })
    return () => {
      cancelled = true
    }
  }, [])
  return defaults
}

export default function GatherPage() {
  const { settings, fields, saveProfile } = useSettings()
  const ts = useStrings(strings)
  const [slot, setSlotState] = useState(readSlot)
  const { patterns, reload: reloadPatterns } = usePatterns()
  const aiDefaults = useAIDefaults()
  const fileInput = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const setSlot = (n: number) => {
    setSlotState(n)
    writeSlot(n)
  }

  const fieldList = useMemo(() => (Array.isArray(settings?.fields) ? (settings.fields as unknown[]) : []), [settings?.fields])
  const enabledList = useMemo(
    () => (Array.isArray(settings?.fields_enabled) ? (settings.fields_enabled as unknown[]) : []),
    [settings?.fields_enabled],
  )

  if (!settings) return <PageLoading />

  const slotField = (i: number) => String(fieldList[i] ?? "")
  const slotEnabled = (i: number) => Boolean(enabledList[i])

  const setSlotEnabled = (i: number, on: boolean) => {
    const next = [...enabledList]
    while (next.length < SLOT_COUNT) next.push(false)
    next[i] = on
    void saveProfile("fields_enabled", next)
  }

  const setSlotField = (i: number, field: string) => {
    const next = [...fieldList]
    while (next.length < SLOT_COUNT) next.push("")
    next[i] = field
    void saveProfile("fields", next)
  }

  const importPatterns = async (files: FileList | null) => {
    const list = Array.from(files ?? [])
    if (!list.length) return
    setImporting(true)
    try {
      const payload: { name: string; content: string }[] = []
      for (const file of list) {
        try {
          payload.push({ name: file.name, content: await file.text() })
        } catch (err) {
          console.error("[gather] could not read", file.name, err)
        }
      }
      const result = await callPy<{ saved?: string[]; errors?: string[] }>("importPatterns", payload)
      const saved = result?.saved ?? []
      const errors = result?.errors ?? []
      if (saved.length) toast.success(ts("patternsSaved", { count: saved.length, list: saved.join(", ") }))
      if (errors.length) toast.error(ts("patternsErrors", { list: errors.join(", ") }))
      if (!saved.length && !errors.length) toast.info(ts("patternsNone"))
      await reloadPatterns()
    } catch (err) {
      console.error("[gather] importPatterns", err)
      toast.error(ts("patternsFailed"))
    } finally {
      setImporting(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const field = slotField(slot)

  return (
    <Page
      title={ts("title")}
      description={ts("subtitle")}
      actions={
        <>
          <input ref={fileInput} type="file" accept=".py,.ahk" multiple hidden onChange={(e) => void importPatterns(e.target.files)} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={importing}>
                {importing ? <Loader2Icon className="animate-spin" /> : <FileUpIcon />}
                {ts("importPatterns")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{ts("importPatternsHint")}</TooltipContent>
          </Tooltip>
        </>
      }
    >
      <SlotPicker
        slot={slot}
        onSelect={setSlot}
        fieldOf={slotField}
        enabledOf={slotEnabled}
        onToggle={setSlotEnabled}
        shapeOf={(i) => String(fields?.[slotField(i)]?.shape ?? "")}
        patterns={patterns ?? []}
      />
      <FieldPanel
        key={`${slot}-${field}`}
        slot={slot}
        field={field}
        enabled={slotEnabled(slot)}
        onEnabledChange={(on) => setSlotEnabled(slot, on)}
        onFieldChange={(f) => setSlotField(slot, f)}
        patterns={patterns}
        aiDefaults={aiDefaults}
      />
    </Page>
  )
}

function patternLabel(p: PatternInfo | undefined, value: string, lang: "ko" | "en") {
  if (value === ROBIN_AI_PATTERN && lang === "ko") return "AI 채집"
  return p?.label ?? value
}

function SlotPicker({
  slot,
  onSelect,
  fieldOf,
  enabledOf,
  onToggle,
  shapeOf,
  patterns,
}: {
  slot: number
  onSelect: (i: number) => void
  fieldOf: (i: number) => string
  enabledOf: (i: number) => boolean
  onToggle: (i: number, on: boolean) => void
  shapeOf: (i: number) => string
  patterns: PatternInfo[]
}) {
  const { lang } = useI18n()
  const ts = useStrings(strings)
  return (
    <div role="tablist" aria-label={ts("title")} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: SLOT_COUNT }, (_, i) => {
        const field = fieldOf(i)
        const key = fieldKey(field)
        const on = enabledOf(i)
        const active = i === slot
        const name = field ? (lang === "ko" ? (FIELD_KO[key] ?? titleCase(field)) : titleCase(field)) : ts("noField")
        const shape = shapeOf(i)
        const onKey = (e: KeyboardEvent) => {
          if (e.target !== e.currentTarget) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSelect(i)
          } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const n = (i + (e.key === "ArrowRight" ? 1 : SLOT_COUNT - 1)) % SLOT_COUNT
            onSelect(n)
            ;(e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus()
          }
        }
        return (
          <div
            key={i}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(i)}
            onKeyDown={onKey}
            className={cn(
              "group relative flex cursor-pointer flex-col gap-1 rounded-xl border bg-card p-3 text-left transition-all outline-none select-none",
              "hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50",
              // pressing the card (not its switch) gives a little under the finger
              "[&:active:not(:has([role=switch]:active))]:scale-[0.98]",
              active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>{ts("slot", { n: i + 1 })}</span>
              <Switch
                size="sm"
                checked={on}
                aria-label={`${ts("slot", { n: i + 1 })} · ${name}`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onCheckedChange={(v) => onToggle(i, v)}
              />
            </div>
            <div className={cn("flex items-center gap-2 pt-1 transition-opacity", !on && "opacity-50")}>
              <span className="text-3xl leading-none" aria-hidden>
                {FIELD_EMOJI[key] ?? "❔"}
              </span>
              <div className="min-w-0">
                <div className="truncate font-semibold">{name}</div>
                {/* the switch already shows on/off, so the second line is just the pattern */}
                <div className="truncate text-xs text-muted-foreground">
                  {field && shape ? patternLabel(patterns.find((p) => p.value.toLowerCase() === shape.toLowerCase()), shape, lang) : " "}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FieldSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lang } = useI18n()
  const options = FIELD_OPTIONS.includes(value) || !value ? FIELD_OPTIONS : [...FIELD_OPTIONS, value]
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id="field" className="w-52">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {options.map((f) => (
          <SelectItem key={f} value={f}>
            {fieldLabel(f, lang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PatternSelect({ value, patterns, onChange }: { value: string; patterns: PatternInfo[] | null; onChange: (v: string) => void }) {
  const { lang } = useI18n()
  const ts = useStrings(strings)
  const list = patterns ?? []
  const current = list.find((p) => p.value.toLowerCase() === value.toLowerCase())
  return (
    <Select value={current ? current.value : value || undefined} onValueChange={onChange} disabled={!patterns}>
      <SelectTrigger id="shape" className="w-52">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {!current && value && (
          <SelectItem value={value} disabled>
            {ts("patternMissing", { name: value })}
          </SelectItem>
        )}
        {list.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            <span className="flex items-center gap-2">
              {patternLabel(p, p.value, lang)}
              {p.aiBacked && (
                <Badge variant="secondary" className="h-4 gap-0.5 px-1.5 text-[0.65rem]">
                  <SparklesIcon className="size-2.5" />
                  AI
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function FieldPanel({
  slot,
  field,
  enabled,
  onEnabledChange,
  onFieldChange,
  patterns,
  aiDefaults,
}: {
  slot: number
  field: string
  enabled: boolean
  onEnabledChange: (on: boolean) => void
  onFieldChange: (field: string) => void
  patterns: PatternInfo[] | null
  aiDefaults: Record<string, FieldSettings>
}) {
  const { fields, saveField, settings } = useSettings()
  const { lang } = useI18n()
  const ts = useStrings(strings)
  const [tokensOpen, setTokensOpen] = useState(false)
  const [gooKey, setGooKey] = useState(0)

  const data = useMemo(() => normalizeFieldData(fields?.[field]), [fields, field])
  const shape = String(data.shape ?? "").toLowerCase()
  const isRobinAI = shape === ROBIN_AI_PATTERN
  const isBloomsAI = shape === BLOOMS_AI_PATTERN
  const isHiveHub = shape === "hive_hub" || field === "hive hub"
  const infinite = Boolean(data.infinite_gather)
  const aiModel = robinAIModelName(settings?.ai_gather_model)

  // saveField(): store the edited value and remember it in the current pattern's preset
  const saveValue = (id: string, value: unknown) => {
    if (!field) return
    let v = value
    if (id === "goo_interval") {
      v = clampGooInterval(value)
      if (v !== value) setGooKey((k) => k + 1)
    }
    void saveField(field, rememberPreset({ ...data, [id]: v }, data.shape))
  }

  const binding: Binding = {
    get: (id) => (id === "field_enable" ? enabled : id === "field" ? field : data[id]),
    set: (def, value) => saveValue(def.id, value),
  }

  const changePattern = (value: string) => {
    if (!field) return
    void saveField(field, applyPatternChange(data, value.toLowerCase(), aiDefaults))
  }

  const limitControl = (def: SettingDef) => (
    <fieldset disabled={infinite} className={cn(infinite && "cursor-not-allowed opacity-45")} title={infinite ? ts("infiniteHint") : undefined}>
      <SettingControl def={def} binding={binding} />
    </fieldset>
  )

  const overrides: SectionOverrides = {
    hidden: (id) => !field && id !== "field" && id !== "field_enable",
    render: {
      field_enable: () => <Switch id="field_enable" checked={enabled} onCheckedChange={onEnabledChange} />,
      field: () => <FieldSelect value={field} onChange={onFieldChange} />,
      shape: () => <PatternSelect value={String(data.shape ?? "")} patterns={patterns} onChange={changePattern} />,
      mins: limitControl,
      backpack: limitControl,
      goo_interval: (def) => <SettingControl key={gooKey} def={def} binding={binding} />,
      "configure-robin-ai-tokens-button": () => (
        <Button variant="secondary" onClick={() => setTokensOpen(true)} disabled={!field}>
          <SparklesIcon />
          {ts("tokensButton")}
        </Button>
      ),
    },
  }

  const fieldSection = sectionByTitle("Gather Field")
  const patternSection = sectionByTitle("Pattern")
  const aiSection = sectionByTitle("AI Gathering")
  const bloomsSection = sectionByTitle("BloomsAI")
  const rest = ["Gather Until", "Rotate Camera", "Start location", "Goo Settings"].map(sectionByTitle).filter(Boolean) as SectionDef[]
  const patternInfo = patterns?.find((p) => p.value.toLowerCase() === shape)
  const describe = (s: SectionDef): SectionDef => {
    const local = shape === ROBIN_AI_PATTERN || shape === BLOOMS_AI_PATTERN ? ts(`patternDesc.${shape}` as "patternDesc.blooms_ai") : ""
    return { ...s, desc: s.desc || local || patternInfo?.description || "" }
  }

  return (
    // remounts (key) when the slot or field changes, so this fade plays once per switch
    <div role="tabpanel" className="grid gap-4 animate-in fade-in-0 duration-200">
      {fieldSection && (
        <SchemaSection
          section={{ ...fieldSection, title: `${ts("slotTitle", { n: slot + 1 })}${field ? ` · ${fieldLabel(field, lang)}` : ""}`, desc: ts("slotDesc") }}
          binding={binding}
          overrides={overrides}
        />
      )}

      {isHiveHub && (
        <Alert variant="warning">
          <InfoIcon />
          <AlertDescription>{ts("hiveHubNotice")}</AlertDescription>
        </Alert>
      )}

      {field && (
        <>
          {patternSection && <SchemaSection section={patternSection} binding={binding} overrides={overrides} />}

          {isRobinAI && aiSection && (
            <SchemaSection section={describe(aiSection)} binding={binding} overrides={overrides}>
              <ModelStatus required={requiredModels(ROBIN_AI_PATTERN, data, settings?.ai_gather_model)} />
            </SchemaSection>
          )}
          {isBloomsAI && bloomsSection && (
            <SchemaSection section={describe(bloomsSection)} binding={binding} overrides={overrides}>
              <ModelStatus required={requiredModels(BLOOMS_AI_PATTERN, data, settings?.ai_gather_model)} />
            </SchemaSection>
          )}

          {rest.map((s) => (
            <SchemaSection key={s.title} section={s} binding={binding} overrides={overrides} />
          ))}

          <FieldTools field={field} />
          <TokenDialog open={tokensOpen} onOpenChange={setTokensOpen} field={field} model={aiModel} />
        </>
      )}
    </div>
  )
}
