import { BanIcon, InfinityIcon, RefreshCwIcon, SwordsIcon, WheatIcon } from "lucide-react"
import { useState, type ComponentType } from "react"

import { TextControl } from "@/components/settings/controls"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useStrings } from "@/i18n"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { strings } from "./strings"

const SLOTS = [1, 2, 3, 4, 5, 6, 7]

/** Saved values are the old dropdown's lower-cased labels. */
const USE_WHEN = [
  { value: "never", Icon: BanIcon },
  { value: "always", Icon: InfinityIcon },
  { value: "gathering", Icon: WheatIcon },
  { value: "converting", Icon: RefreshCwIcon },
  { value: "attacking", Icon: SwordsIcon },
] as const

type UseWhen = (typeof USE_WHEN)[number]["value"]

const lower = (v: unknown) => String(v ?? "").toLowerCase()

function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; Icon?: ComponentType<{ className?: string }> }[]
  value: string
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div role="radiogroup" className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map(({ value: v, label, Icon }) => {
        const on = value === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
              on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function BoostHotbar() {
  const t = useStrings(strings)
  const { settings, saveProfile } = useSettings()
  const [active, setActive] = useState(1)

  const when = (slot: number) => (lower(settings?.[`hotbar${slot}_use_when`]) || "never") as UseWhen
  const unit = (slot: number) => (lower(settings?.[`hotbar${slot}_use_every_format`]) === "mins" ? "mins" : "secs")
  const every = (slot: number) => String(settings?.[`hotbar${slot}_use_every_value`] ?? "")

  const id = (what: string) => `hotbar${active}_${what}`
  const activeWhen = when(active)
  const ActiveIcon = USE_WHEN.find((w) => w.value === activeWhen)?.Icon ?? BanIcon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("hotbarTitle")}</CardTitle>
        <CardDescription>{t("hotbarDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* the hotbar strip, like in game */}
        <div className="grid grid-cols-7 gap-1.5 rounded-xl border bg-muted/30 p-2 sm:gap-2">
          {SLOTS.map((slot) => {
            const w = when(slot)
            const on = w !== "never"
            const Icon = USE_WHEN.find((x) => x.value === w)?.Icon ?? BanIcon
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setActive(slot)}
                aria-pressed={active === slot}
                title={t("slot", { n: slot })}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 text-xs transition-all",
                  active === slot ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:border-primary/50",
                )}
              >
                <span className="absolute top-1 left-1.5 text-[0.65rem] font-semibold text-muted-foreground">{slot}</span>
                <Icon className={cn("size-5 sm:size-6", on ? "text-primary" : "text-muted-foreground/40")} />
                <span className={cn("hidden max-w-full truncate px-1 text-[0.65rem] sm:block", on ? "text-foreground" : "text-muted-foreground")}>
                  {on ? t("every", { value: every(slot), unit: t(unit(slot)) }) : t("off")}
                </span>
              </button>
            )
          })}
        </div>

        {/* settings for the selected slot */}
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ActiveIcon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{t("slot", { n: active })}</p>
              <p className="text-xs text-muted-foreground">{t("slotDesc")}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-sm font-medium">{t("useWhen")}</Label>
              <p className="text-[0.8rem] text-muted-foreground">{t("useWhenDesc")}</p>
            </div>
            <Segmented
              options={USE_WHEN.map((w) => ({ value: w.value, label: t(`when.${w.value}`), Icon: w.Icon }))}
              value={activeWhen}
              onChange={(v) => void saveProfile(id("use_when"), v)}
            />
          </div>
          <div className={cn("space-y-2", activeWhen === "never" && "opacity-60")}>
            <div>
              <Label htmlFor={id("use_every_value")} className="text-sm font-medium">
                {t("useEvery")}
              </Label>
              <p className="text-[0.8rem] text-muted-foreground">{t("useEveryDesc")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TextControl
                key={active}
                id={id("use_every_value")}
                value={settings?.[id("use_every_value")]}
                inputType="float"
                width={8}
                onCommit={(v) => void saveProfile(id("use_every_value"), v)}
              />
              <Segmented
                options={[
                  { value: "secs", label: t("secsLabel") },
                  { value: "mins", label: t("minsLabel") },
                ]}
                value={unit(active)}
                onChange={(v) => void saveProfile(id("use_every_format"), v)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
