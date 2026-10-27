import { SparklesIcon, WheatIcon } from "lucide-react"
import { useMemo } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n, useStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { IconPicker, Row, usePersistedTab } from "./common"
import { fieldOptions, planterKey, planterOptions, sameKey } from "./data"
import { PlanterHotbarSlots, ResetRow, SettingNumber, SettingSwitch } from "./shared"
import { strings } from "./strings"

const CYCLES = [1, 2, 3, 4, 5]
const SLOTS = [1, 2, 3]

/** Unique planters used in the cycles, in order (old getManualSelectedPlanters). */
function manualPlanters(settings: Record<string, unknown>) {
  const out: string[] = []
  for (const c of CYCLES)
    for (const s of SLOTS) {
      const key = planterKey(settings[`cycle${c}_${s}_planter`])
      if (key && key !== "none" && !out.includes(key)) out.push(key)
    }
  return out
}

function CycleCard({ cycle }: { cycle: number }) {
  const t = useStrings(strings)
  const { lang, t: tc } = useI18n()
  const { settings, saveProfile } = useSettings()
  const planters = useMemo(() => planterOptions(lang, tc("common.none")), [lang, tc])
  const fields = useMemo(() => fieldOptions(lang, tc("common.none"), "space"), [lang, tc])
  const get = (slot: number, what: string) => settings?.[`cycle${cycle}_${slot}_${what}`]
  const used = SLOTS.filter((s) => planterKey(get(s, "planter")) !== "none" && planterKey(get(s, "field")) !== "none" && get(s, "planter") && get(s, "field")).length

  return (
    <Card className={cn("@container/cycle", used === 0 && "opacity-90")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{t("cycle", { n: cycle })}</CardTitle>
        <Badge variant={used ? "default" : "outline"}>{used ? t("cycleUsed", { count: used }) : t("cycleEmpty")}</Badge>
      </CardHeader>
      {/* three slots side by side only when the card (not the window) is wide enough for their switch labels */}
      <CardContent className="grid gap-3 @min-[38rem]/cycle:grid-cols-3">
        {SLOTS.map((slot) => {
          const id = (what: string) => `cycle${cycle}_${slot}_${what}`
          return (
            <div key={slot} className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-semibold text-muted-foreground">{t("slot", { n: slot })}</p>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("planter")}</p>
                <IconPicker id={id("planter")} options={planters} value={get(slot, "planter")} matches={sameKey} onChange={(v) => void saveProfile(id("planter"), v)} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("field")}</p>
                <IconPicker id={id("field")} options={fields} value={get(slot, "field")} matches={sameKey} onChange={(v) => void saveProfile(id("field"), v)} />
              </div>
              <label className="flex items-center justify-between gap-2 text-sm" title={t("slotGather.hint")}>
                <span className="flex items-center gap-1.5">
                  <WheatIcon className="size-4 text-muted-foreground" />
                  {t("slotGather")}
                </span>
                <Switch checked={!!get(slot, "gather")} onCheckedChange={(v) => void saveProfile(id("gather"), v)} />
              </label>
              <label className="flex items-center justify-between gap-2 text-sm" title={t("slotGlitter.hint")}>
                <span className="flex items-center gap-1.5">
                  <img src="./assets/icons/glitter.png" alt="" className="size-4 object-contain" />
                  {t("slotGlitter")}
                </span>
                <Switch checked={!!get(slot, "glitter")} onCheckedChange={(v) => void saveProfile(id("glitter"), v)} />
              </label>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function ManualPlanters() {
  const t = useStrings(strings)
  const { settings } = useSettings()
  const [tab, setTab] = usePersistedTab("beolkkuri.planters.manualTab", "basic")
  const selected = useMemo(() => manualPlanters(settings ?? {}), [settings])

  const reset = async () => {
    try {
      await callPy("clearManualPlanters")
      toast.success(t("resetDone"))
    } catch (err) {
      toast.error(String(err))
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="basic">{t("tab.basic")}</TabsTrigger>
        <TabsTrigger value="cycles">{t("tab.cycles")}</TabsTrigger>
        <TabsTrigger value="hotbar">{t("tab.hotbar")}</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("manualTitle")}</CardTitle>
            <CardDescription>{t("manualDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 pt-0">
            <Row id="manual_planters_collect_every" title={t("collectEvery")} desc={t("collectEvery.manual.desc")}>
              <SettingNumber id="manual_planters_collect_every" type="float" limit={4} />
            </Row>
            <Row id="manual_planters_collect_full" title={t("collectFull")} desc={t("collectFull.desc")}>
              <SettingSwitch id="manual_planters_collect_full" />
            </Row>
            <Row id="planters_collect_loot" title={t("loot")} desc={t("loot.desc")}>
              <SettingSwitch id="planters_collect_loot" />
            </Row>
            <Row id="manual_planters_check" title={t("check")} desc={t("check.desc")}>
              <SettingSwitch id="manual_planters_check" />
            </Row>
            <ResetRow onReset={reset} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cycles" className="space-y-4">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="mt-0.5 size-4 shrink-0" />
          {t("cyclesDesc")}
        </p>
        {CYCLES.map((c) => (
          <CycleCard key={c} cycle={c} />
        ))}
      </TabsContent>

      <TabsContent value="hotbar">
        <PlanterHotbarSlots planters={selected} desc={t("hotbar.manual.desc")} />
      </TabsContent>
    </Tabs>
  )
}
