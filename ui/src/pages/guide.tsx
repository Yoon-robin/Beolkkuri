import {
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  FlowerIcon,
  GamepadIcon,
  HomeIcon,
  KeyboardIcon,
  LifeBuoyIcon,
  Loader2Icon,
  MonitorIcon,
  ShieldCheckIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { Page } from "@/components/page"
import { RunButton } from "@/components/run-controls"
import { keybindDisplay } from "@/components/settings/keybind"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { isMac } from "@/lib/platform"
import { py, type PermissionKind } from "@/lib/py"
import type { PageId } from "@/lib/route"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/state/permissions"
import { useSettings, useSetting } from "@/state/settings"

const DOCS = "https://github.com/Yoon-robin/Beolkkuri/blob/main/docs"
const ISSUES = "https://github.com/Yoon-robin/Beolkkuri/issues"

const strings: PageStrings<
  | "subtitle"
  | "progress"
  | "done"
  | "todo"
  | "more"
  | "open"
  | "perm.title"
  | "perm.body"
  | "perm.accessibility"
  | "perm.screen"
  | "perm.keyboard"
  | "perm.on"
  | "perm.off"
  | "perm.unknown"
  | "perm.turnOn"
  | "perm.keyboardOn"
  | "perm.restart"
  | "display.title"
  | "display.body"
  | "game.title"
  | "game.body"
  | "game.ps"
  | "game.psSet"
  | "hive.title"
  | "hive.body"
  | "hive.slot"
  | "fields.title"
  | "fields.body"
  | "fields.count"
  | "fields.none"
  | "start.title"
  | "start.body"
  | "keys.start"
  | "keys.pause"
  | "keys.stop"
  | "tips.title"
  | "tips.1"
  | "tips.2"
  | "tips.3"
  | "tips.4"
  | "help.title"
  | "help.body"
  | "help.button"
> = {
  ko: {
    subtitle: "처음이라면 위에서부터 차례대로 따라 해 보세요. 5분이면 충분해요.",
    progress: "{done}/{total} 완료",
    done: "완료",
    todo: "할 일",
    more: "자세히 보기",
    open: "열기",
    "perm.title": "맥 권한 주기",
    "perm.body": "매크로가 키보드·마우스를 움직이고 화면을 보려면 '터미널'에 두 가지 권한이 필요해요. 켜기를 누르면 설정 화면이 열려요.",
    "perm.accessibility": "손쉬운 사용 (키보드·마우스)",
    "perm.screen": "화면 기록 (화면 보기)",
    "perm.keyboard": "전체 키보드 접근이 켜져 있어요. 매크로가 오작동할 수 있으니 꺼 주세요.",
    "perm.on": "켜짐",
    "perm.off": "꺼짐",
    "perm.unknown": "확인 불가",
    "perm.turnOn": "켜기",
    "perm.keyboardOn": "끄러 가기",
    "perm.restart": "설정에서 켠 뒤에는 터미널을 완전히 껐다가(⌘Q) 벌꿀이를 다시 열어야 적용돼요.",
    "display.title": "화면 설정 확인",
    "display.body": isMac
      ? "디스플레이 배율은 '기본값'으로, 밤 시프트·트루 톤은 꺼 주세요. 로블록스는 주 모니터에서 최대화해서 띄워요."
      : "Windows 디스플레이 배율은 100%로, 야간 모드와 HDR은 꺼 주세요. 로블록스는 주 모니터에서 최대화해서 띄워요.",
    "game.title": "비 스웜 시뮬레이터 들어가기",
    "game.body":
      "로블록스에서 비 스웜 시뮬레이터에 들어가요. 다른 사람 방해를 덜 받는 비공개 서버를 추천해요. 링크를 넣어 두면 튕겼을 때 알아서 다시 들어가요.",
    "game.ps": "비공개 서버 링크 넣기",
    "game.psSet": "비공개 서버 링크가 저장돼 있어요",
    "hive.title": "내 벌집 번호 고르기",
    "hive.body": "벌집은 입구에서 바라봤을 때 오른쪽부터 1번이에요. 매크로가 이 번호의 벌집을 차지하려고 해요.",
    "hive.slot": "벌집 번호",
    "fields.title": "채집할 필드 고르기",
    "fields.body": "채집 메뉴에서 꽃가루를 모을 필드를 켜요. 처음에는 필드 하나만 켜도 충분해요.",
    "fields.count": "필드 {n}곳이 켜져 있어요",
    "fields.none": "아직 켜진 필드가 없어요",
    "start.title": "시작!",
    "start.body": "로블록스 창을 한 번 클릭해 두고 시작을 누르거나 단축키를 눌러요. 그다음엔 마우스와 키보드에서 손을 떼 주세요.",
    "keys.start": "시작",
    "keys.pause": "일시정지",
    "keys.stop": "정지",
    "tips.title": "알아 두면 좋아요",
    "tips.1": "매크로가 도는 동안 로블록스 창을 가리거나 움직이지 마세요.",
    "tips.2": isMac ? "터미널 창은 닫으면 안 돼요. 최소화는 괜찮아요." : "벌꿀이 명령 창은 닫으면 안 돼요. 최소화는 괜찮아요.",
    "tips.3": "디스펜서, 몹 사냥, 퀘스트는 각 메뉴에서 하나씩 켜 보면서 늘려 가요.",
    "tips.4": "디스코드 웹후크를 넣으면 휴대폰으로 진행 상황을 받아볼 수 있어요.",
    "help.title": "잘 안 되나요?",
    "help.body": "설정 → 기타 설정에서 '디버그 파일 저장'을 눌러 만든 파일을 증상과 함께 GitHub Issues에 올려 주세요.",
    "help.button": "문제 알리기",
  },
  en: {
    subtitle: "New here? Work through these steps from the top. It takes about five minutes.",
    progress: "{done}/{total} done",
    done: "Done",
    todo: "To do",
    more: "Learn more",
    open: "Open",
    "perm.title": "Grant macOS permissions",
    "perm.body": "To move the mouse and keyboard and see the screen, Terminal needs two permissions. Press Turn on to open the right settings page.",
    "perm.accessibility": "Accessibility (keyboard & mouse)",
    "perm.screen": "Screen Recording (see the screen)",
    "perm.keyboard": "Full Keyboard Access is on. It can confuse the macro, so please turn it off.",
    "perm.on": "On",
    "perm.off": "Off",
    "perm.unknown": "Can't check",
    "perm.turnOn": "Turn on",
    "perm.keyboardOn": "Turn off",
    "perm.restart": "After turning them on, quit Terminal (⌘Q) and open Beolkkuri again for it to take effect.",
    "display.title": "Check display settings",
    "display.body": isMac
      ? "Keep display scaling at Default and turn off Night Shift and True Tone. Run Roblox maximised on your main monitor."
      : "Set Windows display scale to 100% and turn off Night light and HDR. Run Roblox maximised on your main monitor.",
    "game.title": "Join Bee Swarm Simulator",
    "game.body":
      "Open Bee Swarm Simulator in Roblox. A private server is best. If you save its link, the macro rejoins on its own after a disconnect.",
    "game.ps": "Add private server link",
    "game.psSet": "Private server link saved",
    "hive.title": "Pick your hive slot",
    "hive.body": "Hives are numbered from the right, looking in from the entrance. The macro tries to claim this one.",
    "hive.slot": "Hive slot",
    "fields.title": "Choose fields to gather",
    "fields.body": "Turn on the fields to collect pollen from under Gather. One field is plenty to start with.",
    "fields.count": "{n} field(s) on",
    "fields.none": "No fields are on yet",
    "start.title": "Start!",
    "start.body": "Click the Roblox window once, then press Start or the hotkey. Keep your hands off the mouse and keyboard after that.",
    "keys.start": "Start",
    "keys.pause": "Pause",
    "keys.stop": "Stop",
    "tips.title": "Good to know",
    "tips.1": "Don't cover or move the Roblox window while the macro runs.",
    "tips.2": isMac ? "Keep the Terminal window open. Minimising it is fine." : "Keep the Beolkkuri console window open. Minimising it is fine.",
    "tips.3": "Turn on dispensers, mobs and quests one at a time from their menus.",
    "tips.4": "Add a Discord webhook to follow progress from your phone.",
    "help.title": "Something not working?",
    "help.body": "Press Export debug folder in Settings → Other, then attach the file to a GitHub issue with what happened.",
    "help.button": "Report a problem",
  },
}

const goTo = (page: PageId) => {
  window.location.hash = `/${page}`
}

function Step({
  n,
  icon,
  title,
  done,
  children,
}: {
  n: number
  icon: ReactNode
  title: string
  done?: boolean
  children: ReactNode
}) {
  const s = useStrings(strings)
  return (
    <Card className={cn(done && "ring-emerald-500/35 dark:ring-emerald-400/30")}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors duration-300 [&_svg]:size-4",
              done && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            )}
          >
            <span key={String(!!done)} className={cn("inline-flex", done && "bk-pop")}>
              {done ? <CheckCircle2Icon /> : icon}
            </span>
          </div>
          <CardTitle className="flex-1 text-base">
            <span className="mr-1.5 text-muted-foreground">{n}.</span>
            {title}
          </CardTitle>
          {done !== undefined && (
            <Badge variant={done ? "outline" : "secondary"} className={cn(done && "text-emerald-600 dark:text-emerald-400")}>
              {done ? s("done") : s("todo")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  )
}

function PermissionRow({
  label,
  value,
  kind,
  onOpened,
}: {
  label: string
  value: boolean | null | undefined
  kind: PermissionKind
  onOpened: () => void
}) {
  const s = useStrings(strings)
  const loading = value === undefined
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
          value === true && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          value === false && "bg-destructive/15 text-destructive",
          (value === null || loading) && "bg-muted text-muted-foreground",
        )}
      >
        {loading ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <span key={String(value)} className={cn("inline-flex", value && "bk-pop")}>
            {value ? <CheckCircle2Icon className="size-3.5" /> : <CircleIcon className="size-3.5" />}
          </span>
        )}
      </span>
      <span className="flex-1 text-foreground">{label}</span>
      {value === false ? (
        <Button size="sm" onClick={() => void py.openPrivacySettings(kind).finally(onOpened)}>
          {s("perm.turnOn")}
        </Button>
      ) : (
        !loading && (
          <span className={cn("text-xs animate-in fade-in-0 duration-300", value ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {value ? s("perm.on") : s("perm.unknown")}
          </span>
        )
      )}
    </div>
  )
}

function DocLink({ doc }: { doc: string }) {
  const s = useStrings(strings)
  return (
    <Button variant="outline" size="sm" onClick={() => void py.openLink(`${DOCS}/${doc}.md`)}>
      {s("more")}
      <ExternalLinkIcon />
    </Button>
  )
}

export default function GuidePage() {
  const { t } = useI18n()
  const s = useStrings(strings)
  const { settings, fields, saveGeneral } = useSettings()
  const { status: perms, refresh: refreshPerms } = usePermissions()
  const permsOk = !!perms && perms.accessibility !== false && perms.screenRecording !== false && !perms.fullKeyboardAccess

  const hiveSlot = String(useSetting<number | string>("preferred_hive_slot", 1) ?? 1)
  const privateServer = String(useSetting<string>("private_server_link", "") ?? "").trim()
  const enabledFields = ((settings?.fields_enabled as boolean[] | undefined) ?? []).filter(Boolean).length
  const startKey = keybindDisplay(useSetting<string>("start_keybind", "F1") || "F1")
  const pauseKey = keybindDisplay(useSetting<string>("pause_keybind", "F2") || "F2")
  const stopKey = keybindDisplay(useSetting<string>("stop_keybind", "F3") || "F3")

  // Windows needs no permissions, so its guide starts at the display step.
  const checks = [...(isMac ? [permsOk] : []), !!privateServer, enabledFields > 0]
  const first = isMac ? 1 : 0
  const doneCount = checks.filter(Boolean).length

  return (
    <Page
      title={t("nav.guide")}
      description={s("subtitle")}
      actions={
        settings && fields ? (
          <div className="flex items-center gap-2.5">
            <Progress value={(doneCount / checks.length) * 100} className="h-1.5 w-24 [&>*]:duration-500" aria-label={s("progress", { done: doneCount, total: checks.length })} />
            <Badge variant={doneCount === checks.length ? "outline" : "secondary"} className={cn(doneCount === checks.length && "text-emerald-600 dark:text-emerald-400")}>
              {s("progress", { done: doneCount, total: checks.length })}
            </Badge>
          </div>
        ) : null
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {isMac && (
            <Step n={1} icon={<ShieldCheckIcon />} title={s("perm.title")} done={perms ? permsOk : undefined}>
              <p>{s("perm.body")}</p>
              <div className="space-y-2">
                <PermissionRow label={s("perm.accessibility")} value={perms ? perms.accessibility : undefined} kind="accessibility" onOpened={refreshPerms} />
                <PermissionRow label={s("perm.screen")} value={perms ? perms.screenRecording : undefined} kind="screenRecording" onOpened={refreshPerms} />
                {perms?.fullKeyboardAccess && (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-amber-700 dark:text-amber-300">
                    <span className="flex-1">{s("perm.keyboard")}</span>
                    <Button size="sm" variant="outline" onClick={() => void py.openPrivacySettings("keyboard").finally(refreshPerms)}>
                      {s("perm.keyboardOn")}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs">{s("perm.restart")}</p>
              <DocLink doc="permissions" />
            </Step>
          )}

          <Step n={first + 1} icon={<MonitorIcon />} title={s("display.title")}>
            <p>{s("display.body")}</p>
            <DocLink doc="display-settings" />
          </Step>

          <Step n={first + 2} icon={<GamepadIcon />} title={s("game.title")} done={!!privateServer}>
            <p>{s("game.body")}</p>
            {privateServer ? (
              <p className="text-emerald-600 dark:text-emerald-400">{s("game.psSet")}</p>
            ) : (
              <Button variant="outline" size="sm" onClick={() => goTo("settings")}>
                {s("game.ps")}
              </Button>
            )}
          </Step>

          <Step n={first + 3} icon={<HomeIcon />} title={s("hive.title")}>
            <p>{s("hive.body")}</p>
            <div className="flex items-center gap-3">
              <span className="text-foreground">{s("hive.slot")}</span>
              <Select value={hiveSlot} onValueChange={(v) => void saveGeneral("preferred_hive_slot", Number(v))} disabled={!settings}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Step>

          <Step n={first + 4} icon={<FlowerIcon />} title={s("fields.title")} done={enabledFields > 0}>
            <p>{s("fields.body")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn(enabledFields > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                {enabledFields > 0 ? s("fields.count", { n: enabledFields }) : s("fields.none")}
              </span>
              <Button variant="outline" size="sm" onClick={() => goTo("gather")}>
                {t("nav.gather")}
              </Button>
            </div>
          </Step>

          <Step n={first + 5} icon={<KeyboardIcon />} title={s("start.title")}>
            <p>{s("start.body")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <RunButton size="lg" />
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  [startKey, s("keys.start")],
                  [pauseKey, s("keys.pause")],
                  [stopKey, s("keys.stop")],
                ].map(([key, label]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-foreground">{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </Step>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{s("tips.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {(["tips.1", "tips.2", "tips.3", "tips.4"] as const).map((k) => (
                  <li key={k} className="flex gap-2">
                    <CircleIcon className="mt-1.5 size-2 shrink-0 fill-primary text-primary" />
                    <span>{s(k)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoyIcon className="size-4 text-primary" />
                {s("help.title")}
              </CardTitle>
              <CardDescription>{s("help.body")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" onClick={() => void py.openLink(ISSUES)}>
                {s("help.button")}
                <ExternalLinkIcon />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  )
}
