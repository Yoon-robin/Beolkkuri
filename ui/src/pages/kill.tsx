import { Page } from "@/components/page"
import { SchemaSections } from "@/components/settings/schema-section"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { sectionsFor } from "@/schema"

import { SubTabs } from "./collect/shared"

const ko = {
  description: "어떤 몹과 보스를 잡을지, 리스폰 시간은 어떻게 계산할지 정해요.",
  settings: "설정",
  regular: "일반 몹",
  boss: "보스",
  misc: "기타",
}
const strings: PageStrings<keyof typeof ko> = {
  ko,
  en: {
    description: "Choose which mobs and bosses to kill and how respawn timers are calculated.",
    settings: "Settings",
    regular: "Regular",
    boss: "Bosses",
    misc: "Misc",
  },
}

const panel = (id: string) => <SchemaSections sections={sectionsFor("kill", `${id}-tab`)} />

export default function KillPage() {
  const { t: tr } = useI18n()
  const t = useStrings(strings)
  return (
    <Page title={tr("nav.kill")} description={t("description")}>
      <SubTabs
        storageKey="activeKillSubtab"
        fallback="kill-settings"
        tabs={[
          { value: "kill-settings", label: t("settings"), content: panel("kill-settings") },
          { value: "kill-regular", label: t("regular"), content: panel("kill-regular") },
          { value: "kill-boss", label: t("boss"), content: panel("kill-boss") },
          { value: "kill-misc", label: t("misc"), content: panel("kill-misc") },
        ]}
      />
    </Page>
  )
}
