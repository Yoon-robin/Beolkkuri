import { CheckIcon, ChevronsUpDownIcon, KeyboardIcon, XIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/i18n"
import { setKeybindRecording } from "@/lib/bridge"
import { RichText, plainText } from "@/lib/rich-text"
import { normalizeOptionValue, sameValue, sections, type NormalizedOption } from "@/schema"

import { isModifierOnly, keybindDisplay, keybindFromEvent, normalizeKeybind, validateKeybind } from "./keybind"

/** Legacy widths were given in rem; clamp them into something that fits the card layout. */
const widthStyle = (rem?: number, fallback = 12) => ({ width: `min(100%, ${Math.max(rem ?? fallback, 6)}rem)` })

export function SwitchControl({ id, checked, onChange }: { id?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <Switch id={id} checked={!!checked} onCheckedChange={onChange} />
}

function OptionLabel({ option }: { option: NormalizedOption }) {
  const { option: tr } = useI18n()
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.image && <img src={option.image} alt="" className="size-5 shrink-0 object-contain" draggable={false} />}
      <RichText text={tr(option.label)} className="truncate" />
    </span>
  )
}

export function SelectControl({
  id,
  options,
  value,
  onChange,
  width,
}: {
  id?: string
  options: NormalizedOption[]
  value: unknown
  onChange: (v: string | number) => void
  width?: number
}) {
  const { t } = useI18n()
  const index = options.findIndex((o) => sameValue(o.value, value))
  return (
    <Select value={index >= 0 ? String(index) : ""} onValueChange={(i) => onChange(options[Number(i)].value)}>
      <SelectTrigger id={id} style={widthStyle(width)} className="min-w-36">
        <SelectValue placeholder={t("common.none")}>{index >= 0 ? <OptionLabel option={options[index]} /> : null}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {options.map((o, i) => (
          <SelectItem key={`${o.value}-${i}`} value={String(i)}>
            <OptionLabel option={o} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function toArrayValue(value: unknown): (string | number)[] {
  if (Array.isArray(value)) return value as (string | number)[]
  if (value === null || value === undefined || value === "" || value === "none" || value === 0 || value === "0") return []
  if (typeof value === "string") {
    const s = value.trim()
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s.replaceAll("'", '"'))
        if (Array.isArray(parsed)) return parsed
      } catch {
        // fall through
      }
    }
    if (s.includes(",")) return s.split(",").map((x) => normalizeOptionValue(x)).filter((x) => x !== "")
  }
  return [normalizeOptionValue(value as string)]
}

export function MultiSelectControl({
  id,
  options,
  value,
  onChange,
  max,
  width,
}: {
  id?: string
  options: NormalizedOption[]
  value: unknown
  onChange: (v: (string | number)[]) => void
  max?: number
  width?: number
}) {
  const { t, option: tr } = useI18n()
  const [open, setOpen] = useState(false)
  const selected = toArrayValue(value)
  const isSelected = (v: string | number) => selected.some((s) => sameValue(s, v))
  const labels = options.filter((o) => isSelected(o.value)).map((o) => plainText(tr(o.label)))

  const toggle = (v: string | number) => {
    if (isSelected(v)) onChange(selected.filter((s) => !sameValue(s, v)))
    else if (!max || selected.length < max) onChange([...selected, v])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" aria-expanded={open} style={widthStyle(width, 14)} className="min-w-36 justify-between font-normal">
          <span className="truncate">{labels.length ? labels.join(", ") : t("common.none")}</span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          {options.length > 8 && <CommandInput placeholder={t("common.search")} />}
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup heading={max ? t("common.max", { count: max }) : undefined}>
              {options.map((o, i) => {
                const on = isSelected(o.value)
                return (
                  <CommandItem key={`${o.value}-${i}`} value={plainText(tr(o.label)) + " " + o.value} onSelect={() => toggle(o.value)}>
                    <CheckIcon className={cn("size-4", on ? "opacity-100" : "opacity-0")} />
                    <OptionLabel option={o} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function TextControl({
  id,
  value,
  onCommit,
  inputType = "string",
  inputLimit,
  width,
  placeholder,
  secret,
}: {
  id?: string
  value: unknown
  onCommit: (v: string | number) => void
  inputType?: "string" | "int" | "float"
  inputLimit?: number
  width?: number
  placeholder?: string
  secret?: boolean
}) {
  const external = value === null || value === undefined ? "" : String(value)
  const [draft, setDraft] = useState(external)
  useEffect(() => setDraft(external), [external])

  const accept = (next: string) => {
    if (inputLimit && next.length > inputLimit) return false
    if (inputType === "int") return /^\d*$/.test(next)
    if (inputType === "float") return /^\d*\.?\d*$/.test(next)
    return true
  }
  const commit = () => {
    if (draft === external) return
    // numeric boxes save 0 when emptied, like the original UI
    onCommit(draft === "" && inputType !== "string" ? 0 : draft)
  }

  return (
    <Input
      id={id}
      value={draft}
      type={secret ? "password" : "text"}
      inputMode={inputType === "int" ? "numeric" : inputType === "float" ? "decimal" : undefined}
      placeholder={placeholder}
      style={widthStyle(width, inputType === "string" ? 14 : 7)}
      className={cn(inputType !== "string" && "text-right tabular-nums")}
      onChange={(e) => accept(e.target.value) && setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
      }}
      autoComplete="off"
      spellCheck={false}
    />
  )
}

const keybindTitles = new Map(
  sections.flatMap((s) => s.settings.filter((d) => d.type.name === "keybind").map((d) => [d.id, d] as const)),
)

export function KeybindControl({
  id,
  value,
  settings,
  onChange,
}: {
  id: string
  value: unknown
  settings: Record<string, unknown>
  onChange: (v: string) => void
}) {
  const { t, setting } = useI18n()
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = normalizeKeybind(value)

  useEffect(() => {
    setKeybindRecording(id, recording)
    if (!recording) return
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === "Escape" && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
        setRecording(false)
        return
      }
      const combo = keybindFromEvent(event)
      if (isModifierOnly(combo)) return
      const problem = validateKeybind(combo, id, settings)
      if (problem) {
        const def = problem.kind === "conflict" ? keybindTitles.get(problem.with) : undefined
        setError(
          problem.kind === "conflict"
            ? t("keybind.conflict", { name: def ? setting(def).title : problem.with })
            : t(problem.kind === "needKey" ? "keybind.needKey" : problem.kind === "reserved" ? "keybind.reserved" : "keybind.browser"),
        )
        return
      }
      setError(null)
      setRecording(false)
      onChange(combo)
    }
    window.addEventListener("keydown", onKey, true)
    return () => {
      window.removeEventListener("keydown", onKey, true)
      setKeybindRecording(id, false)
    }
  }, [recording, id, settings, onChange, t, setting])

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <Button
          id={id}
          variant={recording ? "default" : "outline"}
          // only the key itself is monospaced; Korean prompts look letter-spaced in a mono font
          className={cn("min-w-36 justify-center", current && !recording && "font-mono", recording && "animate-pulse")}
          onClick={() => {
            setError(null)
            setRecording((r) => !r)
          }}
          onBlur={() => setRecording(false)}
        >
          <KeyboardIcon />
          {recording ? t("keybind.recording") : current ? keybindDisplay(current) : t("keybind.record")}
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("common.clear")} onClick={() => onChange("")} disabled={!current}>
          <XIcon />
        </Button>
      </div>
      {error && <p className="max-w-64 text-right text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function MultiCheckControl({
  options,
  value,
  onChange,
  max,
  variant,
}: {
  options: NormalizedOption[]
  value: unknown
  onChange: (v: (string | number)[]) => void
  max?: number
  variant?: string
}) {
  const { option: tr } = useI18n()
  const selected = useMemo(() => toArrayValue(value).map(String), [value])
  const showLabels = !options.some((o) => o.image) || (variant ?? "").includes("report-buffs")
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
      {options.map((o) => {
        const on = selected.includes(String(o.value))
        const label = plainText(tr(o.label))
        return (
          <button
            key={String(o.value)}
            type="button"
            title={label}
            aria-pressed={on}
            onClick={() => {
              if (on) onChange(selected.filter((s) => s !== String(o.value)))
              else if (!max || selected.length < max) onChange([...selected, String(o.value)])
            }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center text-[0.7rem] leading-tight transition-[background-color,border-color,opacity,scale] duration-150 active:scale-[0.96]",
              on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-muted/30 opacity-70 hover:opacity-100",
            )}
          >
            {o.image ? <img src={o.image} alt="" className="size-10 object-contain" draggable={false} /> : null}
            {(showLabels || !o.image) && <span className="line-clamp-2">{label}</span>}
            {o.badge && <span className="absolute top-1 right-1 rounded bg-background/80 px-1 text-[0.6rem] font-semibold">{o.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}
