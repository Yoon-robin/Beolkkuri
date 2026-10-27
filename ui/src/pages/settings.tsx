import { InfoIcon } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { Page } from "@/components/page"
import { SchemaSection, type SectionOverrides } from "@/components/settings/schema-section"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { useTabRequest } from "@/lib/focus"
import { callPy } from "@/lib/py"
import { sectionsFor, type SectionDef } from "@/schema"
import { useSettings } from "@/state/settings"

import { BetaUpdateControl, FallbackServersButton, ModelsCard, ReportThemeCard, useDebugExport } from "./settings/other"
import { PrioritySection } from "./settings/priorities"
import { ProfilesSection } from "./settings/profiles"

const strings: PageStrings<
  "title" | "subtitle" | "legacyBot"
> = {
  ko: {
    title: "설정",
    subtitle: "게임 정보, 재접속, 디스코드 알림, 프로필 같은 매크로 전체 설정이에요.",
    legacyBot:
      "이 macOS 버전에서는 봇 명령어를 / 대신 bee!로 시작해요. 예: bee!status. 서버 채널에서 bee! 명령어를 쓰려면 Discord 개발자 포털에서 Message Content 권한을 켜 주세요. 켤 수 없다면 봇을 멘션해서 써도 돼요. 예: @Bot status",
  },
  en: {
    title: "Settings",
    subtitle: "Macro-wide settings: game info, rejoining, Discord notifications and profiles.",
    legacyBot:
      "On this macOS version, bot commands start with bee! instead of /, e.g. bee!status. To use bee! commands in server channels, enable Message Content access in the Discord Developer Portal. If that isn't possible, mention the bot instead, e.g. @Bot status.",
  },
}

const TABS = ["bss", "priorities", "other", "discord", "stream", "profiles"] as const
type TabId = (typeof TABS)[number]

// remember the open sub-tab while the app is running (like the old activeConfigSubtab)
let lastTab: TabId = "bss"


function useConfigSections(panel: string) {
  return useMemo(
    () =>
      sectionsFor("config", panel).map((s) => ({
        ...s,
        desc: s.desc,
        settings: s.settings,
      })),
    [panel],
  )
}

function Sections({ sections, overrides, after }: { sections: SectionDef[]; overrides?: SectionOverrides; after?: Record<string, ReactNode> }) {
  return (
    <div className="grid gap-4">
      {sections.map((s) => (
        <SchemaSection key={`${s.panel}-${s.title}`} section={s} overrides={overrides}>
          {after?.[s.title]}
        </SchemaSection>
      ))}
    </div>
  )
}

function OtherTab() {
  const sections = useConfigSections("other")
  const exportDebug = useDebugExport()
  const overrides: SectionOverrides = {
    render: {
      "manage-fallback-private-servers-button": () => <FallbackServersButton />,
      beta_update_row: () => <BetaUpdateControl />,
    },
    actions: {
      export_debug_button: () => void exportDebug(),
    },
  }
  return (
    <div className="grid gap-4">
      {sections.map((s) =>
        s.title === "Macro Theme" ? (
          <ReportThemeCard key={s.title} />
        ) : (
          <SchemaSection key={s.title} section={s} overrides={overrides} />
        ),
      )}
      <ModelsCard />
    </div>
  )
}

function DiscordTab() {
  const t = useStrings(strings)
  const sections = useConfigSections("discord")
  const { settings } = useSettings()
  const [legacyBot, setLegacyBot] = useState(false)

  useEffect(() => {
    callPy<boolean>("usesLegacyDiscordBot")
      .then((v) => setLegacyBot(!!v))
      .catch(() => setLegacyBot(false))
  }, [])

  // same rules as the old updateDiscordUniversalRouteText()
  const mode = String(settings?.discord_delivery_mode || "both").toLowerCase()
  const overrides: SectionOverrides = {
    hidden: (id) =>
      (id === "discord_bot_token" && mode === "webhook") ||
      (id === "webhook_link" && mode === "discord_bot") ||
      (id === "discord_channel_id" && mode !== "discord_bot"),
  }

  const note =
    legacyBot && mode !== "webhook" ? (
      <Alert className="my-3">
        <InfoIcon />
        <AlertDescription>{t("legacyBot")}</AlertDescription>
      </Alert>
    ) : null

  return <Sections sections={sections} overrides={overrides} after={{ "Discord Delivery": note }} />
}

function PanelSections({ panel }: { panel: string }) {
  const sections = useConfigSections(panel)
  return <Sections sections={sections} />
}

export default function SettingsPage() {
  const t = useStrings(strings)
  const { t: tc } = useI18n()
  const [tab, setTab] = useState<TabId>(lastTab)

  const change = (value: string) => {
    lastTab = value as TabId
    setTab(lastTab)
  }
  useTabRequest("settings", (value) => {
    if ((TABS as readonly string[]).includes(value)) change(value)
  })

  return (
    <Page title={t("title")} description={t("subtitle")}>
      <Tabs value={tab} onValueChange={change}>
        <TabsList>
          {TABS.map((id) => (
            <TabsTrigger key={id} value={id}>
              {tc(`subtab.settings.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="bss">
          <PanelSections panel="bss" />
        </TabsContent>
        <TabsContent value="priorities">
          <PrioritySection />
        </TabsContent>
        <TabsContent value="other">
          <OtherTab />
        </TabsContent>
        <TabsContent value="discord">
          <DiscordTab />
        </TabsContent>
        <TabsContent value="stream">
          <PanelSections panel="stream" />
        </TabsContent>
        <TabsContent value="profiles">
          <ProfilesSection />
        </TabsContent>
      </Tabs>
    </Page>
  )
}
