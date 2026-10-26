// Pieces used by both the manual and auto planter panels.
import { SproutIcon, TimerResetIcon } from "lucide-react"

import { EmptyState } from "@/components/page"
import { SwitchControl, TextControl } from "@/components/settings/controls"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, useStrings } from "@/i18n"
import { useSettings } from "@/state/settings"

import { ConfirmButton, Row } from "./common"
import { icon, planterName } from "./data"
import { strings } from "./strings"

const SLOTS = ["0", "1", "2", "3", "4", "5", "6", "7"]

/** Hotbar slot pickers for the given planter keys (`planter_hotbar_<key>_slot`). */
export function PlanterHotbarSlots({ planters, desc }: { planters: string[]; desc: string }) {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveProfile } = useSettings()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("hotbarTitle")}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        {planters.length === 0 ? (
          <EmptyState icon={SproutIcon} description={t("hotbarEmpty")} className="py-6" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {planters.map((p) => {
              const id = `planter_hotbar_${p}_slot`
              const value = String(settings?.[id] ?? "0")
              return (
                <div key={p} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <img src={icon(`${p}_planter`)} alt="" className="size-8 shrink-0 object-contain" draggable={false} />
                    <span className="truncate text-sm font-medium">{planterName(p, lang)}</span>
                  </span>
                  {/* the old <select> saved the slot as a string */}
                  <Select value={SLOTS.includes(value) ? value : "0"} onValueChange={(v) => void saveProfile(id, v)}>
                    <SelectTrigger className="w-32 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s === "0" ? t("slotInventory") : t("slotN", { n: s })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Switch bound to a profile setting. `unbind` is switched off when this one turns on (old data-input-bind). */
export function SettingSwitch({ id, unbind }: { id: string; unbind?: string }) {
  const { settings, saveProfile } = useSettings()
  return (
    <SwitchControl
      id={id}
      checked={!!settings?.[id]}
      onChange={async (v) => {
        if (v && unbind && settings?.[unbind]) await saveProfile(unbind, false)
        await saveProfile(id, v)
      }}
    />
  )
}

export function SettingNumber({ id, type, limit }: { id: string; type: "int" | "float"; limit: number }) {
  const { settings, saveProfile } = useSettings()
  return <TextControl id={id} value={settings?.[id]} inputType={type} inputLimit={limit} onCommit={(v) => void saveProfile(id, v)} width={8} />
}

export function ResetRow({ onReset }: { onReset: () => Promise<void> }) {
  const t = useStrings(strings)
  return (
    <Row title={t("reset")} desc={t("reset.desc")}>
      <ConfirmButton
        icon={<TimerResetIcon />}
        label={t("resetButton")}
        title={t("resetConfirmTitle")}
        description={t("resetConfirmDesc")}
        confirmLabel={t("resetButton")}
        onConfirm={onReset}
      />
    </Row>
  )
}
