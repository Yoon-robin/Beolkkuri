import { ListOrderedIcon } from "lucide-react"
import { useState } from "react"

import { Page } from "@/components/page"
import { SchemaSection, SchemaSections, type SectionOverrides } from "@/components/settings/schema-section"
import { Button } from "@/components/ui/button"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { sectionsFor, type SectionDef } from "@/schema"
import { useSetting } from "@/state/settings"

import { BlenderItems, BlenderResetButton } from "./collect/blender-items"
import { SubTabs, ZoomableImage } from "./collect/shared"
import { SproutTokenDialog } from "./collect/sprout-token-dialog"
import { isLootSproutModel } from "./collect/sprout-tokens"

const ko = {
  description: "디스펜서, 이벤트, 새싹, 블렌더처럼 맵 곳곳에서 챙길 것들을 정해요.",
  tokenButton: "토큰 고르기",
  zoomHint: "눌러서 크게 보기",
  petalsAlt: "꽃잎과 블룸 정리표",
  sproutsAlt: "새싹 드롭 정리표",
}
const strings: PageStrings<keyof typeof ko> = {
  ko,
  en: {
    description: "Dispensers, events, sprouts, the blender and other things to collect around the map.",
    tokenButton: "Customize tokens",
    zoomHint: "Click to enlarge",
    petalsAlt: "Petals and blooms cheat sheet",
    sproutsAlt: "Sprout drops cheat sheet",
  },
}

const byTitle = (sections: SectionDef[], title: string) => sections.filter((s) => s.title === title)
const without = (sections: SectionDef[], ...titles: string[]) => sections.filter((s) => !titles.includes(s.title))

function ActivitiesPanel() {
  const lootMondo = useSetting("mondo_buff_loot", false)
  // "Loops" only applies while "Collect Loot From Mondo" is on
  const overrides: SectionOverrides = { hidden: (id) => id === "mondo_loot_times" && !lootMondo }
  return <SchemaSections sections={sectionsFor("collect", "collect-activities-tab")} overrides={overrides} />
}

function SeasonalPanel() {
  const t = useStrings(strings)
  const sections = sectionsFor("collect", "collect-seasonal-tab")
  return (
    <>
      <SchemaSections sections={without(sections, "Petals & Blooms")} />
      {byTitle(sections, "Petals & Blooms").map((s) => (
        <SchemaSection key={s.title} section={s}>
          <ZoomableImage src="./assets/cheatsheet/petals.png" alt={t("petalsAlt")} hint={t("zoomHint")} />
        </SchemaSection>
      ))}
    </>
  )
}

function SproutsPanel() {
  const t = useStrings(strings)
  const [tokensOpen, setTokensOpen] = useState(false)
  const model = useSetting("sprouts_ai_model", "standard")
  const sections = sectionsFor("collect", "collect-sprouts-tab")
  const overrides: SectionOverrides = {
    render: {
      "configure-sprout-ai-tokens-button": () => (
        <Button variant="secondary" onClick={() => setTokensOpen(true)}>
          <ListOrderedIcon />
          {t("tokenButton")}
        </Button>
      ),
    },
    // loot models ignore the token list (old refreshSproutAIModelOptions)
    hidden: (id) => id === "configure-sprout-ai-tokens-button" && isLootSproutModel(model),
  }
  return (
    <>
      <SchemaSections sections={without(sections, "Drop Guide")} overrides={overrides} />
      {byTitle(sections, "Drop Guide").map((s) => (
        <SchemaSection key={s.title} section={s}>
          <ZoomableImage src="./assets/cheatsheet/sprouts.png" alt={t("sproutsAlt")} hint={t("zoomHint")} />
        </SchemaSection>
      ))}
      <SproutTokenDialog open={tokensOpen} onOpenChange={setTokensOpen} />
    </>
  )
}

function BlenderPanel() {
  const overrides: SectionOverrides = { render: { "blender-reset": () => <BlenderResetButton /> } }
  return (
    <>
      <SchemaSections sections={sectionsFor("collect", "collect-blender-tab")} overrides={overrides} />
      <BlenderItems />
    </>
  )
}

export default function CollectPage() {
  const { t: tr } = useI18n()
  const t = useStrings(strings)
  return (
    <Page title={tr("nav.collect")} description={t("description")}>
      <SubTabs
        page="collect"
        storageKey="activeCollectSubtab"
        fallback="collect-dispensers"
        tabs={[
          {
            value: "collect-dispensers",
            label: tr("subtab.collect.collect-dispensers"),
            content: <SchemaSections sections={sectionsFor("collect", "collect-dispensers-tab")} />,
          },
          {
            value: "collect-activities",
            label: tr("subtab.collect.collect-activities"),
            content: <ActivitiesPanel />,
          },
          { value: "collect-seasonal", label: tr("subtab.collect.collect-seasonal"), content: <SeasonalPanel /> },
          { value: "collect-sprouts", label: tr("subtab.collect.collect-sprouts"), content: <SproutsPanel /> },
          { value: "collect-blender", label: tr("subtab.collect.collect-blender"), content: <BlenderPanel /> },
        ]}
      />
    </Page>
  )
}
