import { useRef, type ReactNode, type Ref } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n"
import { useFocusTarget } from "@/lib/focus"
import { RichText } from "@/lib/rich-text"
import { cn } from "@/lib/utils"
import { normalizeOptions, saveTargetOf, type SectionDef, type SettingDef } from "@/schema"
import { useSettings } from "@/state/settings"

import { KeybindControl, MultiCheckControl, MultiSelectControl, SelectControl, SwitchControl, TextControl } from "./controls"
import { isVisible } from "./visibility"

/**
 * Where a section reads and writes its values. The default binding talks to the
 * global settings store; the gather page swaps in one bound to a single field.
 */
export type Binding = {
  get: (id: string) => unknown
  set: (def: SettingDef, value: unknown) => void
}

export function useDefaultBinding(): Binding {
  const { settings, saveProfile, saveGeneral } = useSettings()
  return {
    get: (id) => settings?.[id],
    set: (def, value) => {
      const target = saveTargetOf(def)
      if (target === "general") void saveGeneral(def.id, value)
      else void saveProfile(def.id, value)
    },
  }
}

export type SectionOverrides = {
  /** Replace the control for a setting id with custom UI. */
  render?: Record<string, (def: SettingDef) => ReactNode>
  /** Handlers for "button" settings and other non-save triggers, keyed by setting id. */
  actions?: Record<string, (def: SettingDef) => void>
  /** Called instead of the binding for specific ids (custom side effects). */
  onChange?: Record<string, (def: SettingDef, value: unknown) => void>
  /** Extra visibility rule on top of the shared ones. */
  hidden?: (id: string) => boolean
}

export function SettingControl({ def, binding, overrides }: { def: SettingDef; binding: Binding; overrides?: SectionOverrides }) {
  const { settings } = useSettings()
  const { setting } = useI18n()
  const value = binding.get(def.id)
  const custom = overrides?.onChange?.[def.id]
  const set = (v: unknown) => (custom ? custom(def, v) : binding.set(def, v))
  const type = def.type

  if (overrides?.render?.[def.id]) return <>{overrides.render[def.id](def)}</>

  switch (type.name) {
    case "checkbox":
      return <SwitchControl id={def.id} checked={!!value} onChange={set} />
    case "dropdown": {
      const options = normalizeOptions(type.data)
      return type.multiple ? (
        <MultiSelectControl id={def.id} options={options} value={value} onChange={set} max={type.maxSelections} width={type.length} />
      ) : (
        // dropdown values were saved lower-cased as strings by the original UI
        <SelectControl id={def.id} options={options} value={value} onChange={(v) => set(String(v).toLowerCase())} width={type.length} />
      )
    }
    case "textbox":
      return (
        <TextControl
          id={def.id}
          value={value}
          onCommit={set}
          inputType={type.inputType ?? "string"}
          inputLimit={type.inputLimit}
          width={type.length}
          secret={/token/i.test(def.id) && !/tokens|priority|ranking/i.test(def.id)}
        />
      )
    case "keybind":
      return <KeybindControl id={def.id} value={value} settings={settings ?? {}} onChange={set} />
    case "multicheck":
      return <MultiCheckControl options={normalizeOptions(type.data)} value={value} onChange={set} max={type.maxSelections} variant={type.variant} />
    case "button":
      return (
        <Button variant="secondary" onClick={() => overrides?.actions?.[def.id]?.(def)} disabled={!overrides?.actions?.[def.id]}>
          {/* a label that just repeats the row title uses the translated title */}
          <RichText text={type.text && type.text !== def.title ? type.text : setting(def).title} />
        </Button>
      )
    case "textbox_with_button": {
      const inputId = type.inputId ?? `${def.id}_input`
      return (
        <div className="flex items-center gap-2">
          <TextControl id={inputId} value={binding.get(inputId)} onCommit={(v) => binding.set({ ...def, id: inputId }, v)} width={type.inputWidth ?? type.length ?? 12} />
          <Button variant="secondary" onClick={() => overrides?.actions?.[def.id]?.(def)}>
            {type.buttonText ?? "OK"}
          </Button>
        </div>
      )
    }
    default:
      return null
  }
}

/**
 * Shared layout for one setting: title + helper text on the left, control on the right
 * (or below when `stacked`). Every settings-style row in the app should use this.
 */
export function SettingRowLayout({
  htmlFor,
  title,
  desc,
  children,
  stacked,
  className,
  ref,
}: {
  ref?: Ref<HTMLDivElement>
  htmlFor?: string
  title: ReactNode
  desc?: ReactNode
  children: ReactNode
  stacked?: boolean
  className?: string
}) {
  return (
    <div ref={ref} className={cn("flex gap-x-6 gap-y-3 py-3", stacked ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={htmlFor} className="text-sm leading-snug font-medium">
          {title}
        </Label>
        {desc && <p className="text-[0.8rem] leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      {/* controls hug the right edge so inputs, selects and switches line up between rows */}
      <div className={cn("shrink-0", !stacked && "flex sm:max-w-[55%] sm:justify-end")}>{children}</div>
    </div>
  )
}

export function SettingRow({ def, binding, overrides }: { def: SettingDef; binding: Binding; overrides?: SectionOverrides }) {
  const { setting } = useI18n()
  const { title, desc } = setting(def)
  const ref = useRef<HTMLDivElement>(null)
  useFocusTarget(def.id, ref)
  return (
    <SettingRowLayout
      ref={ref}
      htmlFor={def.id}
      title={<RichText text={title} />}
      desc={desc ? <RichText text={desc} /> : undefined}
      stacked={def.type.name === "multicheck"}
    >
      <SettingControl def={def} binding={binding} overrides={overrides} />
    </SettingRowLayout>
  )
}

export function SchemaSection({
  section,
  binding,
  overrides,
  children,
  actions,
  className,
}: {
  section: SectionDef
  binding?: Binding
  overrides?: SectionOverrides
  /** Extra content rendered after the generated rows. */
  children?: ReactNode
  /** Extra content in the card header (e.g. a reset button). */
  actions?: ReactNode
  className?: string
}) {
  const defaultBinding = useDefaultBinding()
  const b = binding ?? defaultBinding
  const { section: trSection, setting } = useI18n()
  const { title, desc } = trSection(section)
  const visible = section.settings.filter((d) => isVisible(d.id, b.get) && !overrides?.hidden?.(d.id))
  // a search jump to a setting that is hidden right now lands on its section instead
  const hiddenIds = section.settings.filter((d) => d.id && !visible.includes(d)).map((d) => d.id)
  const cardRef = useRef<HTMLDivElement>(null)
  useFocusTarget(hiddenIds, cardRef)

  return (
    <Card ref={cardRef} className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-1 text-base">
            <RichText text={title} />
          </CardTitle>
          {desc && (
            <CardDescription>
              <RichText text={desc} />
            </CardDescription>
          )}
        </div>
        {actions}
      </CardHeader>
      {(visible.length > 0 || children) && (
        <CardContent className="divide-y divide-border/60 pt-0">
          {visible.map((def, i) =>
            def.type.name === "separator" ? (
              <div key={`sep-${i}`} className="pt-5 pb-1">
                <p className="text-sm font-semibold">
                  <RichText text={setting(def).title} />
                </p>
                {def.desc && (
                  <p className="text-xs text-muted-foreground">
                    <RichText text={setting(def).desc} />
                  </p>
                )}
              </div>
            ) : (
              <SettingRow key={def.id} def={def} binding={b} overrides={overrides} />
            ),
          )}
          {children}
        </CardContent>
      )}
    </Card>
  )
}

/** Render every section of a legacy tab/panel in order. */
export function SchemaSections({
  sections,
  binding,
  overrides,
  className,
}: {
  sections: SectionDef[]
  binding?: Binding
  overrides?: SectionOverrides
  className?: string
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {sections.map((s) => (
        <SchemaSection key={`${s.panel}-${s.title}`} section={s} binding={binding} overrides={overrides} />
      ))}
    </div>
  )
}
