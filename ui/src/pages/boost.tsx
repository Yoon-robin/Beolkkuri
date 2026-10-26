import { CopyIcon, TimerResetIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Page, PageLoading } from "@/components/page"
import { SelectControl } from "@/components/settings/controls"
import { SchemaSections, type SectionOverrides } from "@/components/settings/schema-section"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n, useStrings } from "@/i18n"
import { callPy, py, type Settings } from "@/lib/py"
import { sectionsFor, type SettingDef } from "@/schema"
import { useSettings } from "@/state/settings"

import { BoostHotbar } from "./boost/hotbar"
import { strings } from "./boost/strings"
import { ConfirmButton, IconPicker, usePersistedTab } from "./planters/common"
import { fieldOptions, sameKey } from "./planters/data"

/** Every Glitter hotbar slot setting is kept in sync (old syncGlitterHotbarSlot). */
const GLITTER_SLOT_IDS = ["field_booster_glitter_slot", "AFB_slotG", "tad_alt_glitter_slot"]

type Pattern = string | { name?: string; label?: string; value?: string }

const normField = (v: unknown) => String(v ?? "").trim().toLowerCase().replaceAll("_", " ").replace(/\s+/g, " ")

function useBoostOverrides(): SectionOverrides {
  const t = useStrings(strings)
  const { lang, t: tc } = useI18n()
  const { settings, saveProfile, patchLocal } = useSettings()
  const [patterns, setPatterns] = useState<{ value: string; label: string }[]>([])
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    callPy<Pattern[]>("getDefaultPatterns")
      .then((list) =>
        setPatterns(
          (list ?? []).map((p) => {
            const raw = typeof p === "string" ? p : (p.value ?? p.name ?? "")
            const label = typeof p === "string" ? p : (p.label ?? p.name ?? raw)
            return { value: String(raw).toLowerCase(), label }
          }),
        ),
      )
      .catch((err) => {
        console.error("getDefaultPatterns", err)
        toast.error(t("patternsFailed"))
      })
  }, [t])

  // the old tab used `fields` keys ("pine_tree") for these two dropdowns
  const fields = useMemo(() => fieldOptions(lang, tc("common.none"), "underscore"), [lang, tc])
  const slotOptions = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: n === 0 ? t("glitterSlot0") : String(n) })), [t])
  const glitterSlot = settings?.field_booster_glitter_slot ?? settings?.tad_alt_glitter_slot ?? settings?.AFB_slotG ?? 1

  const fieldPicker = (def: SettingDef) => (
    <IconPicker id={def.id} options={fields} value={settings?.[def.id]} matches={sameKey} onChange={(v) => void saveProfile(def.id, v)} className="w-56" />
  )
  const glitterPicker = (def: SettingDef) => (
    <SelectControl
      id={def.id}
      options={slotOptions}
      value={glitterSlot}
      width={12}
      onChange={(v) => {
        const slot = Number(v)
        for (const id of GLITTER_SLOT_IDS) void saveProfile(id, slot)
      }}
    />
  )

  const copyFieldSettings = async () => {
    if (copying) return
    setCopying(true)
    const fieldName = String(settings?.tad_alt_default_field || "pine tree").trim()
    try {
      const all = await py.loadFields()
      const source = Object.entries(all ?? {}).find(([key]) => normField(key) === normField(fieldName))?.[1]
      if (!source) throw new Error(`No host settings found for ${fieldName}`)
      const s = source as Settings
      const copied: Settings = {
        tad_alt_gather_shape: s.shape || "e_lol",
        tad_alt_gather_size: s.size || "m",
        tad_alt_gather_width: s.width ?? 5,
        tad_alt_gather_shift_lock: Boolean(s.shift_lock),
        tad_alt_gather_drift_compensation: Boolean(s.field_drift_compensation),
        tad_alt_gather_invert_lr: Boolean(s.invert_lr),
        tad_alt_gather_invert_fb: Boolean(s.invert_fb),
        tad_alt_gather_turn: s.turn || "none",
        tad_alt_gather_turn_times: s.turn_times ?? 1,
        tad_alt_gather_start_location: s.start_location || "center",
        tad_alt_gather_distance: s.distance ?? 1,
        tad_alt_gather_goo: Boolean(s.goo),
        tad_alt_gather_goo_interval: s.goo_interval ?? 3,
      }
      await py.saveDictProfileSettings(copied)
      patchLocal(copied)
      toast.success(t("copied", { field: fieldName.replaceAll("_", " ") }))
    } catch (err) {
      console.error("Could not copy host field settings to TAD Alt", err)
      toast.error(t("copyFailed", { field: fieldName.replaceAll("_", " ") }))
    } finally {
      setCopying(false)
    }
  }

  const clearAFB = async () => {
    try {
      await callPy("clearAFB")
      toast.success(t("afbResetDone"))
    } catch (err) {
      toast.error(String(err))
    }
  }

  return {
    render: {
      AFB_field: fieldPicker,
      tad_alt_default_field: fieldPicker,
      field_booster_glitter_slot: glitterPicker,
      AFB_slotG: glitterPicker,
      tad_alt_glitter_slot: glitterPicker,
      tad_alt_gather_shape: (def) => (
        <SelectControl
          id={def.id}
          options={patterns}
          value={settings?.[def.id] || "e_lol"}
          width={13}
          onChange={(v) => void saveProfile(def.id, String(v).toLowerCase())}
        />
      ),
      "AFB-reset": () => (
        <ConfirmButton
          icon={<TimerResetIcon />}
          label={t("afbReset")}
          title={t("afbResetTitle")}
          description={t("afbResetDesc")}
          confirmLabel={t("afbReset")}
          onConfirm={clearAFB}
        />
      ),
      tad_alt_copy_field_settings: () => (
        <Button variant="secondary" onClick={copyFieldSettings} disabled={copying}>
          <CopyIcon />
          {t("copySettings")}
        </Button>
      ),
    },
  }
}

export default function BoostPage() {
  const t = useStrings(strings)
  const { t: tc } = useI18n()
  const { settings } = useSettings()
  const [tab, setTab] = usePersistedTab("robin.boost.tab", "hotbar")
  const overrides = useBoostOverrides()
  if (!settings) return <PageLoading />

  return (
    <Page title={tc("nav.boost")} description={t("subtitle")}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="hotbar">{t("tab.hotbar")}</TabsTrigger>
          <TabsTrigger value="buffs">{t("tab.buffs")}</TabsTrigger>
          <TabsTrigger value="tad">{t("tab.tad")}</TabsTrigger>
        </TabsList>
        <TabsContent value="hotbar">
          <BoostHotbar />
        </TabsContent>
        <TabsContent value="buffs">
          <SchemaSections sections={sectionsFor("boost", "boost-buffs-tab")} overrides={overrides} />
        </TabsContent>
        <TabsContent value="tad">
          <SchemaSections sections={sectionsFor("boost", "boost-tad-alt-sync-tab")} overrides={overrides} />
        </TabsContent>
      </Tabs>
    </Page>
  )
}
