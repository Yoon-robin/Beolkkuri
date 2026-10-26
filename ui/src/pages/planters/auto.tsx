import { ChevronDownIcon, TriangleAlertIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { SelectControl, SwitchControl } from "@/components/settings/controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n, useStrings } from "@/i18n"
import { FIELD_EMOJI, FIELD_NECTAR } from "@/lib/game-data"
import { callPy, py, type Settings } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { IconPicker, Row, usePersistedTab, ZoomImage } from "./common"
import { FIELDS, fieldName, icon, NECTARS, nectarOptions, PLANTERS, planterName, PRESETS } from "./data"
import { PlanterHotbarSlots, ResetRow, SettingNumber, SettingSwitch } from "./shared"
import { strings } from "./strings"

const restrictionId = (planter: string, field: string) => `auto_planter_${planter}_field_${field}`

/** Save several profile settings at once and mirror them locally. */
function useSaveMany() {
  const { patchLocal } = useSettings()
  return useCallback(
    async (patch: Settings) => {
      patchLocal(patch)
      try {
        await py.saveDictProfileSettings(patch)
      } catch (err) {
        toast.error(String(err))
      }
    },
    [patchLocal],
  )
}

function FieldTile({ field, on, onToggle }: { field: string; on: boolean; onToggle: () => void }) {
  const { lang } = useI18n()
  const nectar = FIELD_NECTAR[field]
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
        on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-muted/20 text-muted-foreground opacity-70 hover:opacity-100",
      )}
    >
      <span className="text-lg leading-none">{FIELD_EMOJI[field]}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{fieldName(field, lang)}</span>
      {nectar && <img src={icon(nectar)} alt="" className="size-4 shrink-0 object-contain" draggable={false} />}
    </button>
  )
}

function BasicCard() {
  const t = useStrings(strings)
  const { settings, saveProfile, revision } = useSettings()
  const saveMany = useSaveMany()
  const [gather, setGather] = useState(false)

  // the gather flag lives in auto_planters.json, not in the profile
  useEffect(() => {
    callPy<{ gather?: boolean }>("getAutoPlanterData")
      .then((d) => setGather(!!d?.gather))
      .catch((err) => console.warn("getAutoPlanterData", err))
  }, [revision])

  const presetOptions = useMemo(
    () => (["blue", "red", "white", "custom"] as const).map((p) => ({ value: p, label: t(`preset.${p}`) })),
    [t],
  )

  const reset = async () => {
    // the old button sent resetAutoPlanterTimer('all'), which Python rejects; reset each slot instead
    try {
      await Promise.all([0, 1, 2].map((i) => callPy("resetAutoPlanterTimer", i)))
      toast.success(t("resetDone"))
    } catch (err) {
      toast.error(String(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("autoTitle")}</CardTitle>
        <CardDescription>{t("autoDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 pt-0">
        <Row id="auto_preset" title={t("preset")} desc={t("preset.desc")}>
          <SelectControl
            id="auto_preset"
            options={presetOptions}
            value={settings?.auto_preset}
            onChange={async (v) => {
              const preset = String(v).toLowerCase()
              await saveProfile("auto_preset", preset)
              const data = PRESETS[preset]
              if (data) {
                await saveMany(data)
                toast.success(t("presetApplied", { name: t(`preset.${preset as "blue"}`) }))
              }
            }}
          />
        </Row>
        <Row id="auto_planters_collect_every" title={t("collectEvery")} desc={t("collectEvery.auto.desc")}>
          <SettingNumber id="auto_planters_collect_every" type="float" limit={4} />
        </Row>
        <Row id="auto_planters_collect_full" title={t("collectFull")} desc={t("collectFull.auto.desc")}>
          <SettingSwitch id="auto_planters_collect_full" unbind="auto_planters_collect_auto" />
        </Row>
        <Row id="auto_planters_collect_auto" title={t("collectAuto")} desc={t("collectAuto.desc")}>
          <SettingSwitch id="auto_planters_collect_auto" unbind="auto_planters_collect_full" />
        </Row>
        <Row id="planters_collect_loot" title={t("loot")} desc={t("loot.desc")}>
          <SettingSwitch id="planters_collect_loot" />
        </Row>
        <Row id="auto_planters_check" title={t("check")} desc={t("check.desc")}>
          <SettingSwitch id="auto_planters_check" />
        </Row>
        <Row id="auto_max_planters" title={t("maxPlanters")} desc={t("maxPlanters.desc")}>
          <SettingNumber id="auto_max_planters" type="int" limit={1} />
        </Row>
        <Row id="auto_planters_gather" title={t("gather")} desc={t("gather.desc")}>
          <SwitchControl
            id="auto_planters_gather"
            checked={gather}
            onChange={async (v) => {
              setGather(v)
              try {
                await callPy("setAutoPlanterGather", !!v)
              } catch (err) {
                setGather(!v)
                toast.error(String(err))
              }
            }}
          />
        </Row>
        <ResetRow onReset={reset} />
      </CardContent>
    </Card>
  )
}

function NectarPriority() {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveProfile } = useSettings()
  const options = useMemo(() => nectarOptions(lang), [lang])
  const chosen = NECTARS.map((_, i) => String(settings?.[`auto_priority_${i}_nectar`] ?? "").toLowerCase())
  const duplicate = chosen.some((n, i) => n && chosen.indexOf(n) !== i)

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("tab.nectar")}</CardTitle>
          <CardDescription>{t("nectarDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[2.5rem_1fr_7rem] gap-3 px-1 text-xs font-medium text-muted-foreground">
            <span>{t("rank")}</span>
            <span>{t("nectar")}</span>
            <span className="text-right">{t("minPercent")}</span>
          </div>
          {NECTARS.map((_, i) => (
            <div key={i} className="grid grid-cols-[2.5rem_1fr_7rem] items-center gap-3 rounded-lg border bg-muted/20 p-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{i + 1}</span>
              <IconPicker
                id={`auto_priority_${i}_nectar`}
                options={options}
                columns={5}
                value={settings?.[`auto_priority_${i}_nectar`]}
                onChange={(v) => void saveProfile(`auto_priority_${i}_nectar`, v)}
                className="max-w-64"
              />
              <div className="flex items-center justify-end gap-1">
                <SettingNumber id={`auto_priority_${i}_min`} type="int" limit={3} />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ))}
          {duplicate && (
            <p className="flex items-start gap-2 pt-1 text-xs text-amber-600 dark:text-amber-400">
              <TriangleAlertIcon className="size-4 shrink-0" />
              {t("duplicateNectar")}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("nectarCheat")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ZoomImage src="./assets/cheatsheet/nectar.png" alt={t("nectarCheat")} className="max-w-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

function PlanterRestriction({ planter }: { planter: string }) {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveProfile } = useSettings()
  const saveMany = useSaveMany()
  const [open, setOpen] = useState(false)
  const enabledId = `auto_planter_${planter}`
  const enabled = !!settings?.[enabledId]
  const count = FIELDS.filter((f) => !!settings?.[restrictionId(planter, f)]).length
  const setAll = (value: boolean) => void saveMany(Object.fromEntries(FIELDS.map((f) => [restrictionId(planter, f), value])))

  return (
    <div className={cn("rounded-lg border transition-colors", enabled ? "border-primary/40 bg-primary/5" : "bg-muted/10")}>
      <div className="flex items-center gap-3 p-2.5">
        <Switch id={enabledId} checked={enabled} onCheckedChange={(v) => void saveProfile(enabledId, v)} />
        <img src={icon(`${planter}_planter`)} alt="" className={cn("size-8 object-contain", !enabled && "opacity-50 grayscale")} draggable={false} />
        <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", !enabled && "text-muted-foreground")}>{planterName(planter, lang)}</span>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Badge variant="outline">{t("allowedCount", { count })}</Badge>
          <ChevronDownIcon className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      </div>
      {open && (
        <div className="space-y-2 border-t p-2.5">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="xs" onClick={() => setAll(true)}>
              {t("selectAll")}
            </Button>
            <Button variant="outline" size="xs" onClick={() => setAll(false)}>
              {t("selectNone")}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {FIELDS.map((f) => {
              const id = restrictionId(planter, f)
              const on = !!settings?.[id]
              return <FieldTile key={f} field={f} on={on} onToggle={() => void saveProfile(id, !on)} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PlantersAndFields() {
  const t = useStrings(strings)
  const { settings, saveProfile } = useSettings()
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("restrictTitle")}</CardTitle>
          <CardDescription>{t("restrictDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {PLANTERS.map((p) => (
            <PlanterRestriction key={p} planter={p} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("allowedFields")}</CardTitle>
          <CardDescription>{t("allowedFieldsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {FIELDS.map((f) => {
            const id = `auto_field_${f}`
            const on = !!settings?.[id]
            return <FieldTile key={f} field={f} on={on} onToggle={() => void saveProfile(id, !on)} />
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("waxTitle")}</CardTitle>
          <CardDescription>{t("waxDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ZoomImage src="./assets/cheatsheet/planters.png" alt={t("waxTitle")} className="max-w-xl" />
        </CardContent>
      </Card>
    </div>
  )
}

export function AutoPlanters() {
  const t = useStrings(strings)
  const { settings, revision } = useSettings()
  const saveMany = useSaveMany()
  const [tab, setTab] = usePersistedTab("robin.planters.autoTab", "basic")
  const enabled = useMemo(() => PLANTERS.filter((p) => !!settings?.[`auto_planter_${p}`]), [settings])

  // per-planter field restrictions default to "allowed" when missing (old loadPlanters behaviour)
  const seeded = useRef(-1)
  useEffect(() => {
    if (!settings || seeded.current === revision) return
    seeded.current = revision
    const missing: Settings = {}
    for (const p of PLANTERS) for (const f of FIELDS) if (!(restrictionId(p, f) in settings)) missing[restrictionId(p, f)] = true
    if (Object.keys(missing).length) void saveMany(missing)
  }, [settings, revision, saveMany])

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="basic">{t("tab.basic")}</TabsTrigger>
        <TabsTrigger value="nectar">{t("tab.nectar")}</TabsTrigger>
        <TabsTrigger value="planters">{t("tab.planters")}</TabsTrigger>
        <TabsTrigger value="hotbar">{t("tab.hotbar")}</TabsTrigger>
      </TabsList>
      <TabsContent value="basic">
        <BasicCard />
      </TabsContent>
      <TabsContent value="nectar">
        <NectarPriority />
      </TabsContent>
      <TabsContent value="planters">
        <PlantersAndFields />
      </TabsContent>
      <TabsContent value="hotbar">
        <PlanterHotbarSlots planters={enabled} desc={t("hotbar.auto.desc")} />
      </TabsContent>
    </Tabs>
  )
}
