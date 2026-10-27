import { Page } from "@/components/page"
import { SelectControl, TextControl } from "@/components/settings/controls"
import { SchemaSections } from "@/components/settings/schema-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { QUEST_EMOJI, QUEST_KO } from "@/lib/game-data"
import { normalizeOptions, sectionsFor } from "@/schema"
import { useSettings } from "@/state/settings"

import { SubTabs } from "./collect/shared"

const ko = {
  description: "곰과 벌 NPC의 퀘스트를 자동으로 진행해요.",
  overrideTitle: "퀘스트별 채집 설정",
  overrideDesc: "퀘스트를 할 때만 채집 시간과 하이브 복귀 방법을 따로 정할 수 있어요. 시간을 0으로 두면 원래 채집 설정을 그대로 써요.",
  quest: "퀘스트",
  mins: "채집 시간(분)",
  returnToHive: "하이브 복귀",
}
const strings: PageStrings<keyof typeof ko> = {
  ko,
  en: {
    description: "Complete quests from the bear and bee NPCs automatically.",
    overrideTitle: "Override Gather Settings",
    overrideDesc: "Per-quest gather overrides (mins / return). Set mins to 0 for no override.",
    quest: "Quest",
    mins: "Gather Until Mins",
    returnToHive: "Return To Hive",
  },
}

const QUEST_GIVERS = [
  { key: "polar_bear", label: "Polar Bear" },
  { key: "brown_bear", label: "Brown Bear" },
  { key: "black_bear", label: "Black Bear" },
  { key: "honey_bee", label: "Honey Bee" },
  { key: "bucko_bee", label: "Bucko Bee" },
  { key: "riley_bee", label: "Riley Bee" },
]

const RETURN_OPTIONS = normalizeOptions(["No Override", "💀 Reset", "👟 Walk", "🔄 Rejoin", "🌱 Whirligig"])

/** The old compact per-quest override table ({quest}_quest_gather_mins / _return). */
function QuestOverrides() {
  const t = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveProfile } = useSettings()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("overrideTitle")}</CardTitle>
        <CardDescription>{t("overrideDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="hidden grid-cols-[1fr_8rem_12rem] gap-4 border-b pb-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("quest")}</span>
          <span>{t("mins")}</span>
          <span>{t("returnToHive")}</span>
        </div>
        <div className="divide-y divide-border/60">
          {QUEST_GIVERS.map((q) => {
            const minsId = `${q.key}_quest_gather_mins`
            const retId = `${q.key}_quest_gather_return`
            return (
              <div key={q.key} className="grid grid-cols-2 items-center gap-x-4 gap-y-2 py-2.5 sm:grid-cols-[1fr_8rem_12rem]">
                <span className="col-span-2 text-sm font-medium sm:col-span-1">
                  {QUEST_EMOJI[q.key]} {lang === "ko" ? QUEST_KO[q.key] : q.label}
                </span>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground sm:hidden">{t("mins")}</span>
                  <TextControl
                    id={minsId}
                    value={settings?.[minsId]}
                    onCommit={(v) => void saveProfile(minsId, v)}
                    inputType="float"
                    inputLimit={4}
                    width={8}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground sm:hidden">{t("returnToHive")}</span>
                  <SelectControl
                    id={retId}
                    options={RETURN_OPTIONS}
                    value={settings?.[retId]}
                    onChange={(v) => void saveProfile(retId, String(v).toLowerCase())}
                    width={12}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function QuestsPage() {
  const { t: tr } = useI18n()
  const t = useStrings(strings)
  return (
    <Page title={tr("nav.quests")} description={t("description")}>
      <SubTabs
        page="quests"
        storageKey="activeQuestsSubtab"
        fallback="quests-quests"
        tabs={[
          { value: "quests-quests", label: tr("subtab.quests.quests-quests"), content: <SchemaSections sections={sectionsFor("quests", "quests-quests-tab")} /> },
          {
            value: "quests-settings",
            label: tr("subtab.quests.quests-settings"),
            content: (
              <>
                <QuestOverrides />
                <SchemaSections sections={sectionsFor("quests", "quests-settings-tab")} />
              </>
            ),
          },
        ]}
      />
    </Page>
  )
}
