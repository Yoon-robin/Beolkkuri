import { CalculatorIcon, EggIcon, MousePointerClickIcon, OctagonXIcon, TicketIcon, ZapIcon, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Page } from "@/components/page"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStrings, type PageStrings } from "@/i18n"
import { callPy } from "@/lib/py"
import { cn } from "@/lib/utils"

import { AutoClickerTool } from "./tools/auto-clicker"
import { BondCalculator } from "./tools/bond-calculator"
import { GiftedBasicBeeTool } from "./tools/gifted-basic-bee"
import { HotbarBuffTool } from "./tools/hotbar-buff"
import {
  isBusy,
  syncToolSession,
  useToolStatus,
  type AutoClickerStatus,
  type GiftedBasicBeeStatus,
  type HotbarBuffStatus,
} from "./tools/shared"
import { TicketCalculator } from "./tools/ticket-calculator"

// Tell Python a new UI session started as soon as the app loads (the old GUI did
// this on startup). It stops tools left running by a previous UI session.
void syncToolSession()

const SUBTAB_KEY = "robinmacro_tools_subtab"
const TABS = ["autoclicker", "hotbar-buff", "bond-calculator", "ticket-calculator", "auto-gifted-basic-bee"] as const
type TabId = (typeof TABS)[number]

function readSubtab(): TabId {
  try {
    const saved = localStorage.getItem(SUBTAB_KEY)
    if (saved && (TABS as readonly string[]).includes(saved)) return saved as TabId
  } catch {
    // storage unavailable
  }
  return "autoclicker"
}

const strings: PageStrings<
  | "title"
  | "subtitle"
  | "tab.autoclicker"
  | "tab.hotbar-buff"
  | "tab.bond-calculator"
  | "tab.ticket-calculator"
  | "tab.auto-gifted-basic-bee"
  | "running"
  | "stopAll"
  | "stopAllTitle"
  | "stopAllDesc"
  | "stopAllConfirm"
  | "cancel"
  | "stoppedAll"
  | "stopAllFailed"
> = {
  ko: {
    title: "도구",
    subtitle: "매크로를 멈춘 상태에서 직접 플레이할 때 쓰는 보조 도구와 계산기예요.",
    "tab.autoclicker": "오토 클릭",
    "tab.hotbar-buff": "핫바 버프",
    "tab.bond-calculator": "유대감 계산기",
    "tab.ticket-calculator": "티켓 계산기",
    "tab.auto-gifted-basic-bee": "기프티드 기본 벌",
    running: "실행 중",
    stopAll: "모든 도구 멈추기",
    stopAllTitle: "실행 중인 도구를 모두 멈출까요?",
    stopAllDesc: "오토 클릭, 핫바 버프, 기프티드 기본 벌 뽑기를 한 번에 멈춰요.",
    stopAllConfirm: "모두 멈추기",
    cancel: "취소",
    stoppedAll: "모든 도구를 멈췄어요.",
    stopAllFailed: "도구를 멈추지 못했어요",
  },
  en: {
    title: "Tools",
    subtitle: "Helpers and calculators for when you play by hand with the macro stopped.",
    "tab.autoclicker": "Auto Clicker",
    "tab.hotbar-buff": "Hotbar Buff",
    "tab.bond-calculator": "Bond Calculator",
    "tab.ticket-calculator": "Ticket Price Calculator",
    "tab.auto-gifted-basic-bee": "Auto Gifted Basic Bee",
    running: "Running",
    stopAll: "Stop all tools",
    stopAllTitle: "Stop every running tool?",
    stopAllDesc: "Stops the Auto Clicker, Hotbar Buff and Auto Gifted Basic Bee at once.",
    stopAllConfirm: "Stop all",
    cancel: "Cancel",
    stoppedAll: "All tools stopped.",
    stopAllFailed: "Couldn't stop the tools",
  },
}

const ICONS: Record<TabId, LucideIcon> = {
  autoclicker: MousePointerClickIcon,
  "hotbar-buff": ZapIcon,
  "bond-calculator": CalculatorIcon,
  "ticket-calculator": TicketIcon,
  "auto-gifted-basic-bee": EggIcon,
}

export default function ToolsPage() {
  const t = useStrings(strings)
  const [tab, setTab] = useState<TabId>(readSubtab)
  const [clicker, refreshClicker] = useToolStatus<AutoClickerStatus>("getAutoClickerStatus")
  const [hotbar, refreshHotbar] = useToolStatus<HotbarBuffStatus>("getHotbarBuffStatus")
  const [gifted, refreshGifted] = useToolStatus<GiftedBasicBeeStatus>("getAutoGiftedBasicBeeStatus")

  // statuses can change during the session sync; refresh once it settles
  useEffect(() => {
    void syncToolSession().then(() => {
      void refreshClicker()
      void refreshHotbar()
      void refreshGifted()
    })
  }, [refreshClicker, refreshHotbar, refreshGifted])

  const running: Partial<Record<TabId, boolean>> = {
    autoclicker: isBusy(clicker),
    "hotbar-buff": isBusy(hotbar),
    "auto-gifted-basic-bee": isBusy(gifted),
  }
  const anyRunning = Object.values(running).some(Boolean)

  const changeTab = (next: string) => {
    setTab(next as TabId)
    try {
      localStorage.setItem(SUBTAB_KEY, next)
    } catch {
      // ignore
    }
  }

  const stopAll = async () => {
    try {
      await callPy("stopAllTools")
      toast.success(t("stoppedAll"))
    } catch (err) {
      toast.error(t("stopAllFailed"), { description: String(err) })
    }
    await Promise.all([refreshClicker(), refreshHotbar(), refreshGifted()])
  }

  return (
    <Page
      title={t("title")}
      description={t("subtitle")}
      actions={
        anyRunning && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <OctagonXIcon />
                {t("stopAll")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("stopAllTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("stopAllDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => void stopAll()}>{t("stopAllConfirm")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      }
    >
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          {TABS.map((id) => {
            const Icon = ICONS[id]
            return (
              <TabsTrigger key={id} value={id} className="gap-1.5">
                <Icon className="size-4" />
                {t(`tab.${id}`)}
                {running[id] && (
                  <span className="relative flex size-2" title={t("running")}>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className={cn("relative inline-flex size-2 rounded-full bg-emerald-500")} />
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="autoclicker">
          <AutoClickerTool status={clicker} refresh={refreshClicker} />
        </TabsContent>
        <TabsContent value="hotbar-buff">
          <HotbarBuffTool status={hotbar} refresh={refreshHotbar} />
        </TabsContent>
        <TabsContent value="bond-calculator">
          <BondCalculator />
        </TabsContent>
        <TabsContent value="ticket-calculator">
          <TicketCalculator />
        </TabsContent>
        <TabsContent value="auto-gifted-basic-bee">
          <GiftedBasicBeeTool status={gifted} refresh={refreshGifted} />
        </TabsContent>
      </Tabs>
    </Page>
  )
}
