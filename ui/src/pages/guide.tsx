import {
  ArrowDownIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  ExternalLinkIcon,
  FlowerIcon,
  GamepadIcon,
  HomeIcon,
  KeyboardIcon,
  LanguagesIcon,
  LifeBuoyIcon,
  Loader2Icon,
  MonitorIcon,
  ScanTextIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import { Page } from "@/components/page"
import { RunButton } from "@/components/run-controls"
import { readStartMode, saveStartMode, StartModeChooser } from "@/components/start-setup"
import { TextControl } from "@/components/settings/controls"
import { keybindDisplay } from "@/components/settings/keybind"
import { SettingControl, SettingRowLayout, useDefaultBinding, type Binding } from "@/components/settings/schema-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { beeCount, fieldBees, fieldLabel } from "@/lib/game-data"
import { isMac, isWindows } from "@/lib/platform"
import { py, type OcrStatus, type PermissionKind } from "@/lib/py"
import type { PageId } from "@/lib/route"
import { cn } from "@/lib/utils"
import { FIELD_OPTIONS, SLOT_COUNT } from "@/pages/gather/data"
import { sections, type SettingDef } from "@/schema"
import { useOcrStatus } from "@/state/ocr"
import { formatDuration } from "@/state/run-state"
import { usePermissions } from "@/state/permissions"
import { useSettings, useSetting } from "@/state/settings"

const DOCS = "https://github.com/Yoon-robin/Beolkkuri/blob/main/docs"
const ISSUES = "https://github.com/Yoon-robin/Beolkkuri/issues"

const strings: PageStrings<
  | "subtitle"
  | "progress"
  | "done"
  | "todo"
  | "optional"
  | "more"
  | "next"
  | "allDone"
  | "markDone"
  | "undoDone"
  | "expand"
  | "collapse"
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
  | "ocr.title"
  | "ocr.body"
  | "ocr.label"
  | "ocr.install"
  | "ocr.installed"
  | "ocr.installing"
  | "ocr.note"
  | "ocr.failed"
  | "ocr.cancelled"
  | "ocr.step.approve"
  | "ocr.step.approveSlow"
  | "ocr.step.preparing"
  | "ocr.step.download"
  | "ocr.step.check"
  | "ocr.slowNote"
  | "lang.title"
  | "lang.body"
  | "lang.how"
  | "display.title"
  | "display.body"
  | "player.title"
  | "player.body"
  | "player.speed"
  | "player.speedHow"
  | "player.speedEmpty"
  | "player.bees"
  | "player.beesHow"
  | "player.beesEmpty"
  | "player.sprinkler"
  | "player.sprinklerHow"
  | "player.slot"
  | "player.slotHow"
  | "player.confirm"
  | "game.title"
  | "game.body"
  | "game.ps"
  | "game.psHow"
  | "hive.title"
  | "hive.body"
  | "fields.title"
  | "fields.body"
  | "fields.pick"
  | "fields.needBees"
  | "fields.count"
  | "fields.none"
  | "fields.locked"
  | "fields.more"
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
  | "tips.5"
  | "help.title"
  | "help.body"
  | "help.button"
> = {
  ko: {
    subtitle: "처음이라면 위에서부터 차례대로 따라 해 보세요. 필요한 설정은 모두 여기서 바로 넣을 수 있어요.",
    progress: "{done}/{total} 완료",
    done: "완료",
    todo: "할 일",
    optional: "선택",
    more: "자세히 보기",
    next: "다음 할 일",
    allDone: "준비 끝",
    markDone: "했어요",
    undoDone: "아직 안 했어요",
    expand: "펼치기",
    collapse: "접기",
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
    "ocr.title": "영어 글자 인식 추가하기",
    "ocr.body": "벌꿀이는 윈도우에 들어 있는 글자 인식(OCR)으로 꿀 양이나 퀘스트 같은 게임 글자를 읽어요. 게임 글자가 영어라서 영어 글자 인식이 있으면 가장 정확해요.",
    "ocr.label": "영어 글자 인식 (OCR)",
    "ocr.install": "설치하기",
    "ocr.installed": "설치됨",
    "ocr.installing": "설치하는 중",
    "ocr.note": "설치하기를 누르면 관리자 확인 창이 한 번 떠요. '예'를 누르면 윈도우가 내려받아 설치해요. 몇 분 걸릴 수 있어요.",
    "ocr.failed": "설치되지 않았어요. 다시 눌러 보세요. 영어 글자 인식이 없어도 숫자와 영어는 대부분 읽어요.",
    "ocr.cancelled": "관리자 확인 창에서 '아니요'를 눌러서 설치하지 않았어요. 설치하기를 다시 누르면 돼요.",
    "ocr.step.approve": "관리자 확인 창에서 '예'를 눌러 주세요",
    "ocr.step.approveSlow": "확인 창이 안 보이면 작업 표시줄에서 깜박이는 방패 아이콘을 눌러 보세요.",
    "ocr.step.preparing": "윈도우가 설치를 준비하는 중",
    "ocr.step.download": "내려받아 설치하는 중",
    "ocr.step.check": "잘 설치됐는지 확인하는 중",
    "ocr.slowNote": "숫자가 한동안 그대로여도 정상이에요. 인터넷 속도에 따라 몇 분 걸려요. 끝나면 저절로 바뀌어요.",
    "lang.title": "로블록스 언어를 영어로 바꾸기",
    "lang.body": "매크로는 게임 속 영어 글자와 버튼 모양을 보고 상황을 알아봐요. 로블록스가 한국어로 보이면 꿀 만들기 버튼이나 벌집을 못 찾아서 멈춰요.",
    "lang.how": "로블록스 웹사이트 → 설정 → 계정 정보 → 언어를 English로 바꾸고 게임에 다시 들어가요. 게임 안 Esc 메뉴 → 설정에 언어 항목이 있으면 거기서 바꿔도 돼요.",
    "display.title": "화면 설정 확인",
    "display.body": isMac
      ? "디스플레이 배율은 '기본값'으로, 밤 시프트·트루 톤은 꺼 주세요. 로블록스는 주 모니터에서 최대화해서 띄워요."
      : "Windows 디스플레이 배율은 100%로, 야간 모드와 HDR은 꺼 주세요. 로블록스는 주 모니터에서 최대화해서 띄워요.",
    "player.title": "내 캐릭터 정보 넣기",
    "player.body": "매크로는 이 숫자로 걷는 시간과 갈 수 있는 필드를 정해요. 게임에서 확인하고 그대로 넣어 주세요. 처음 값은 오래 한 사람 기준이라 새로 시작했다면 꼭 바꿔야 해요.",
    "player.speed": "이동 속도",
    "player.speedHow": "게임 화면 왼쪽 위 톱니바퀴(Settings)를 열면 Movement Speed가 나와요. 헤이스트 같은 버프가 없을 때의 숫자를 소수점까지 그대로 넣어요.",
    "player.speedEmpty": "이동 속도를 넣어 주세요. 비어 있으면 매크로가 기본값으로 걸어서 자주 엇나가요.",
    "player.bees": "벌 수",
    "player.beesHow": "내 벌집에 있는 벌이 몇 마리인지예요. 벌이 모자라면 들어갈 수 없는 필드가 있어서, 아래 필드 고르기에 바로 반영돼요.",
    "player.beesEmpty": "벌 수를 넣어 주세요.",
    "player.sprinkler": "스프링클러",
    "player.sprinklerHow": "가진 스프링클러를 골라요. 아직 없으면 '없음'을 골라요.",
    "player.slot": "스프링클러 칸",
    "player.slotHow": "스프링클러를 화면 아래 핫바의 몇 번 칸에 넣어 뒀는지예요. 핫바에 없으면 매크로가 놓지 못해요.",
    "player.confirm": "이대로 맞아요",
    "game.title": "비 스웜 시뮬레이터 들어가기",
    "game.body": "로블록스에서 비 스웜 시뮬레이터에 들어가요. 매크로를 시작했을 때 게임이 꺼져 있거나 튕기면 알아서 다시 들어가요.",
    "game.ps": "비공개 서버 링크",
    "game.psHow": "비공개 서버가 있으면 링크를 붙여 넣어요. 다른 사람 방해를 덜 받아요. 없으면 비워 둬도 돼요. 공개 서버로 들어가요.",
    "hive.title": "벌집 정하기",
    "hive.body": "매크로를 시작할 때 벌집을 어떻게 할지 골라요. 여기서 고르지 않으면 처음 시작할 때 물어봐요.",
    "fields.title": "채집할 필드 고르기",
    "fields.body": "꽃가루를 모을 필드를 골라요. 벌이 모자라서 들어갈 수 없는 필드는 고를 수 없어요. 처음에는 필드 하나면 충분해요.",
    "fields.pick": "채집 필드",
    "fields.needBees": "벌 {n}마리부터",
    "fields.count": "필드 {n}곳이 켜져 있어요",
    "fields.none": "아직 켜진 필드가 없어요",
    "fields.locked": "{slot}번 칸의 필드({field})는 벌이 {n}마리 있어야 들어갈 수 있어요. 다른 필드를 고르거나 벌 수를 다시 확인해 주세요.",
    "fields.more": "채집 메뉴에서 더 설정하기",
    "start.title": "시작!",
    "start.body": "로블록스 창을 한 번 클릭해 두고 시작을 누르거나 단축키를 눌러요. 그다음엔 마우스와 키보드에서 손을 떼 주세요.",
    "keys.start": "시작",
    "keys.pause": "일시정지",
    "keys.stop": "정지",
    "tips.title": "알아 두면 좋아요",
    "tips.1": "매크로가 도는 동안 로블록스 창을 가리거나 움직이지 마세요.",
    "tips.2": isMac ? "터미널 창은 닫으면 안 돼요. 최소화는 괜찮아요." : "벌꿀이 명령 창은 닫으면 안 돼요. 최소화는 괜찮아요.",
    "tips.3": "벌이 늘거나 새 스프링클러를 얻으면 '내 캐릭터 정보 넣기'의 숫자도 바꿔 주세요.",
    "tips.4": "디스펜서, 몹 사냥, 퀘스트는 각 메뉴에서 하나씩 켜 보면서 늘려 가요.",
    "tips.5": "디스코드 웹후크를 넣으면 휴대폰으로 진행 상황을 받아볼 수 있어요.",
    "help.title": "잘 안 되나요?",
    "help.body": "설정 → 기타 설정에서 '디버그 파일 저장'을 눌러 만든 파일을 증상과 함께 GitHub Issues에 올려 주세요.",
    "help.button": "문제 알리기",
  },
  en: {
    subtitle: "New here? Work through these steps from the top. Everything you need to set is right on this page.",
    progress: "{done}/{total} done",
    done: "Done",
    todo: "To do",
    optional: "Optional",
    more: "Learn more",
    next: "Next step",
    allDone: "All set",
    markDone: "Done it",
    undoDone: "Not yet",
    expand: "Show",
    collapse: "Hide",
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
    "ocr.title": "Add English text recognition",
    "ocr.body": "Beolkkuri reads game text such as honey and quests with the text recognition (OCR) built into Windows. The game is in English, so English OCR reads it best.",
    "ocr.label": "English text recognition (OCR)",
    "ocr.install": "Install",
    "ocr.installed": "Installed",
    "ocr.installing": "Installing",
    "ocr.note": "Install asks for administrator approval once. Click Yes and Windows downloads it, which can take a few minutes.",
    "ocr.failed": "It wasn't installed. Try again. Without it, Beolkkuri still reads most numbers and English text.",
    "ocr.cancelled": "The administrator prompt was declined, so nothing was installed. Press Install to try again.",
    "ocr.step.approve": "Click Yes in the administrator prompt",
    "ocr.step.approveSlow": "Can't see the prompt? Click the flashing shield icon in the taskbar.",
    "ocr.step.preparing": "Windows is getting ready",
    "ocr.step.download": "Downloading and installing",
    "ocr.step.check": "Checking that it worked",
    "ocr.slowNote": "The number can sit still for a while; that's normal. It takes a few minutes depending on your connection and updates by itself when done.",
    "lang.title": "Set Roblox to English",
    "lang.body": "The macro finds its way by the game's English text and buttons. If Roblox shows another language, it can't find the Make Honey button or your hive and gets stuck.",
    "lang.how": "On the Roblox website, open Settings → Account Info → Language, choose English, then rejoin the game. If the in-game Esc menu → Settings has a Language option, that works too.",
    "display.title": "Check display settings",
    "display.body": isMac
      ? "Keep display scaling at Default and turn off Night Shift and True Tone. Run Roblox maximised on your main monitor."
      : "Set Windows display scale to 100% and turn off Night light and HDR. Run Roblox maximised on your main monitor.",
    "player.title": "Enter your character's stats",
    "player.body": "The macro times its walks and picks fields from these numbers, so copy them from the game. The starting values suit a long-time player; change them if you're new.",
    "player.speed": "Movement speed",
    "player.speedHow": "Open the gear (Settings) at the top left of the game to see Movement Speed. Enter it without haste or other buffs, decimals included.",
    "player.speedEmpty": "Enter your movement speed. Without it the macro walks at the default speed and often misses.",
    "player.bees": "Bees",
    "player.beesHow": "How many bees are in your hive. Some fields need more bees to enter, and the field picker below follows this number.",
    "player.beesEmpty": "Enter your bee count.",
    "player.sprinkler": "Sprinkler",
    "player.sprinklerHow": "Choose the sprinkler you have, or None if you don't have one yet.",
    "player.slot": "Sprinkler slot",
    "player.slotHow": "The hotbar slot (bottom of the screen) your sprinkler is in. The macro can't place it if it isn't on the hotbar.",
    "player.confirm": "These are right",
    "game.title": "Join Bee Swarm Simulator",
    "game.body": "Open Bee Swarm Simulator in Roblox. If the game is closed when the macro starts, or you get disconnected, it joins again by itself.",
    "game.ps": "Private server link",
    "game.psHow": "Paste a private server link if you have one; other players get in the way less. You can leave it empty to join public servers.",
    "hive.title": "Choose how to get your hive",
    "hive.body": "Pick what the macro does about your hive when it starts. If you skip this, it asks at the first start.",
    "fields.title": "Choose a field to gather",
    "fields.body": "Pick the field to collect pollen in. Fields you don't have enough bees for can't be picked. One field is plenty to start with.",
    "fields.pick": "Gather field",
    "fields.needBees": "{n}+ bees",
    "fields.count": "{n} field(s) on",
    "fields.none": "No fields are on yet",
    "fields.locked": "Slot {slot}'s field ({field}) needs {n} bees to enter. Pick another field or check your bee count.",
    "fields.more": "More in Gather",
    "start.title": "Start!",
    "start.body": "Click the Roblox window once, then press Start or the hotkey. Keep your hands off the mouse and keyboard after that.",
    "keys.start": "Start",
    "keys.pause": "Pause",
    "keys.stop": "Stop",
    "tips.title": "Good to know",
    "tips.1": "Don't cover or move the Roblox window while the macro runs.",
    "tips.2": isMac ? "Keep the Terminal window open. Minimising it is fine." : "Keep the Beolkkuri console window open. Minimising it is fine.",
    "tips.3": "When you get more bees or a new sprinkler, update them under Enter your character's stats too.",
    "tips.4": "Turn on dispensers, mobs and quests one at a time from their menus.",
    "tips.5": "Add a Discord webhook to follow progress from your phone.",
    "help.title": "Something not working?",
    "help.body": "Press Export debug folder in Settings → Other, then attach the file to a GitHub issue with what happened.",
    "help.button": "Report a problem",
  },
}

const goTo = (page: PageId) => {
  window.location.hash = `/${page}`
}

const SETTING_DEFS = new Map(sections.flatMap((s) => s.settings).map((d) => [d.id, d] as const))
const settingDef = (id: string) => SETTING_DEFS.get(id) as SettingDef

/** "hive hub" is a place to stand, not a field with flowers. */
const GUIDE_FIELDS = FIELD_OPTIONS.filter((f) => f !== "hive hub")

const stepAnchor = (key: string) => `guide-${key}`

/** Scroll a step into view and make it glow once, like a setting reached from search. */
function showStep(key: string) {
  const el = document.getElementById(stepAnchor(key))
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "start" })
  el.classList.remove("bk-flash")
  void el.offsetWidth
  el.classList.add("bk-flash")
  const done = (e: AnimationEvent) => {
    if (e.target !== el || e.animationName !== "bk-flash") return
    el.classList.remove("bk-flash")
    el.removeEventListener("animationend", done)
  }
  el.addEventListener("animationend", done)
}

function Step({
  stepKey,
  n,
  icon,
  title,
  done,
  optional,
  children,
}: {
  stepKey: string
  n: number
  icon: ReactNode
  title: string
  /** undefined while it can't be told yet (settings loading) or for steps without a check */
  done?: boolean
  optional?: boolean
  children: ReactNode
}) {
  const s = useStrings(strings)
  // Steps already done when the page opens start folded. One that needs work again opens
  // and stays open after you finish it, so what you're editing doesn't vanish.
  const [folded, setFolded] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    if (done === undefined) return
    if (folded === undefined) setFolded(done)
    else if (!done && folded) setFolded(false)
  }, [done, folded])
  const open = !done || folded !== true

  return (
    <Card id={stepAnchor(stepKey)} className={cn("scroll-mt-20", done && "ring-emerald-500/35 dark:ring-emerald-400/30")}>
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
          {done ? (
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
              {s("done")}
            </Badge>
          ) : optional ? (
            <Badge variant="outline">{s("optional")}</Badge>
          ) : (
            done === false && <Badge variant="secondary">{s("todo")}</Badge>
          )}
          {done && (
            <Button variant="ghost" size="icon-sm" aria-label={open ? s("collapse") : s("expand")} aria-expanded={open} onClick={() => setFolded(open)}>
              <ChevronDownIcon className={cn("transition-transform duration-200", open && "rotate-180")} />
            </Button>
          )}
        </div>
      </CardHeader>
      {open && <CardContent className="space-y-3 text-sm text-muted-foreground">{children}</CardContent>}
    </Card>
  )
}

/** For steps that can't be checked from here: you say when you've done them. */
function MarkDone({ settingId }: { settingId: string }) {
  const s = useStrings(strings)
  const { settings, saveGeneral } = useSettings()
  const done = settings?.[settingId] === true
  return done ? (
    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => void saveGeneral(settingId, false)}>
      {s("undoDone")}
    </Button>
  ) : (
    <Button size="sm" onClick={() => void saveGeneral(settingId, true)} disabled={!settings}>
      <CheckIcon />
      {s("markDone")}
    </Button>
  )
}

function StatusDot({ value }: { value: boolean | null | undefined }) {
  const loading = value === undefined
  return (
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
      <StatusDot value={value} />
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

function OcrRow({ status, onInstall }: { status: OcrStatus | undefined; onInstall: () => void }) {
  const s = useStrings(strings)
  const value = status?.installed
  const busy = !status || status.installing
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <StatusDot value={busy ? undefined : value} />
      <span className="flex-1 text-foreground">{s("ocr.label")}</span>
      {status?.installing ? (
        <span className="text-xs text-muted-foreground tabular-nums animate-in fade-in-0 duration-300">
          {s("ocr.installing")}
          {status.elapsed !== undefined && ` · ${formatDuration(status.elapsed * 1000)}`}
        </span>
      ) : value === false ? (
        <Button size="sm" onClick={onInstall}>
          {s("ocr.install")}
        </Button>
      ) : (
        !busy && (
          <span className={cn("text-xs animate-in fade-in-0 duration-300", value ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {value ? s("ocr.installed") : s("perm.unknown")}
          </span>
        )
      )}
    </div>
  )
}

/** What the install is doing right now, so a few quiet minutes don't look stuck. */
function OcrProgress({ status }: { status: OcrStatus }) {
  const s = useStrings(strings)
  const { step, percent } = status
  const known = typeof percent === "number"
  // Older apps only say "installing"; they get the spinner and the timer above.
  if (!step) return null
  const label =
    step === "approve" ? s("ocr.step.approve") : step === "check" ? s("ocr.step.check") : known ? s("ocr.step.download") : s("ocr.step.preparing")
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 px-3 py-2.5 animate-in fade-in-0 duration-300">
      <div className="flex items-baseline gap-2 text-foreground">
        <span key={label} className="flex-1 bk-swap">
          {label}
        </span>
        {step === "download" && known && <span className="text-xs tabular-nums text-muted-foreground">{percent.toFixed(1)}%</span>}
      </div>
      {step === "download" && known && <Progress value={percent} className="h-1.5 [&>*]:duration-700" aria-label={label} />}
      {step === "approve" && (status.elapsed ?? 0) >= 15 && <p className="text-xs">{s("ocr.step.approveSlow")}</p>}
      {step === "download" && <p className="text-xs">{s("ocr.slowNote")}</p>}
      <OcrLog lines={status.log} />
    </div>
  )
}

/** DISM's last few lines, as it printed them (English). */
function OcrLog({ lines }: { lines?: string[] }) {
  if (!lines?.length) return null
  return (
    <div className="space-y-0.5 font-mono text-[0.7rem] leading-relaxed text-muted-foreground/80">
      {lines.map((line, i) => (
        <p key={`${i}:${line}`} className="truncate" title={line}>
          {line}
        </p>
      ))}
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

function Warning({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-amber-700 dark:text-amber-300">{children}</p>
}

/** Walk speed, bees and sprinkler: what every walk and field choice is worked out from. */
function PlayerStep({ n, done }: { n: number; done: boolean | undefined }) {
  const s = useStrings(strings)
  const { settings, saveGeneral } = useSettings()
  const base = useDefaultBinding()
  // changing any of them here counts as having checked them (all four are general settings)
  const binding: Binding = {
    get: base.get,
    set: (def, value) =>
      void saveGeneral(def.id, value).then(() => (settings?.guide_player_done !== true ? saveGeneral("guide_player_done", true) : undefined)),
  }
  const speed = Number(settings?.movespeed ?? 0)
  const bees = beeCount(settings?.bees)
  const noSprinkler = String(settings?.sprinkler_type ?? "").toLowerCase() === "none"

  const row = (id: string, title: string, desc: string) => (
    <SettingRowLayout htmlFor={id} title={title} desc={desc}>
      <SettingControl def={settingDef(id)} binding={binding} />
    </SettingRowLayout>
  )

  return (
    <Step stepKey="player" n={n} icon={<UserRoundIcon />} title={s("player.title")} done={done}>
      <p>{s("player.body")}</p>
      <div className="divide-y rounded-lg border bg-muted/30 px-3">
        {row("movespeed", s("player.speed"), s("player.speedHow"))}
        {row("bees", s("player.bees"), s("player.beesHow"))}
        {row("sprinkler_type", s("player.sprinkler"), s("player.sprinklerHow"))}
        {!noSprinkler && row("sprinkler_slot", s("player.slot"), s("player.slotHow"))}
      </div>
      {settings && !(speed > 0) && <Warning>{s("player.speedEmpty")}</Warning>}
      {settings && !(bees > 0) && <Warning>{s("player.beesEmpty")}</Warning>}
      {settings && !done && (
        <Button size="sm" onClick={() => void saveGeneral("guide_player_done", true)}>
          <CheckIcon />
          {s("player.confirm")}
        </Button>
      )}
    </Step>
  )
}

/** The fields switched on, and those of them the bee count doesn't reach yet. */
function useFieldPlan() {
  const { settings } = useSettings()
  const bees = beeCount(settings?.bees ?? 50)
  const list = Array.isArray(settings?.fields) ? (settings.fields as unknown[]).map((f) => String(f ?? "")) : []
  const enabled = Array.isArray(settings?.fields_enabled) ? (settings.fields_enabled as unknown[]).map(Boolean) : []
  const on = list.map((field, slot) => ({ field, slot })).filter(({ field, slot }) => field && enabled[slot])
  const locked = on.filter(({ field }) => fieldBees(field) > bees)
  return { bees, list, enabled, on, locked }
}

function FieldStep({ n, done }: { n: number; done: boolean | undefined }) {
  const s = useStrings(strings)
  const { lang } = useI18n()
  const { settings, saveProfile } = useSettings()
  const { bees, list, enabled, on, locked } = useFieldPlan()
  const first = list[0] ?? ""

  // the same saves the Gather page makes for slot 1, then switch it on
  const pick = async (field: string) => {
    const fields = [...list]
    const flags = [...enabled]
    while (fields.length < SLOT_COUNT) fields.push("")
    while (flags.length < SLOT_COUNT) flags.push(false)
    fields[0] = field
    flags[0] = true
    await saveProfile("fields", fields)
    await saveProfile("fields_enabled", flags)
  }

  return (
    <Step stepKey="fields" n={n} icon={<FlowerIcon />} title={s("fields.title")} done={done}>
      <p>{s("fields.body")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-foreground">{s("fields.pick")}</span>
        <Select value={GUIDE_FIELDS.includes(first) ? first : undefined} onValueChange={(v) => void pick(v)} disabled={!settings}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {GUIDE_FIELDS.map((f) => {
              const need = fieldBees(f)
              return (
                <SelectItem key={f} value={f} disabled={need > bees}>
                  {fieldLabel(f, lang)}
                  {need > 0 && <span className="ml-2 text-xs text-muted-foreground">{s("fields.needBees", { n: need })}</span>}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
      {locked.map(({ field, slot }) => (
        <Warning key={slot}>{s("fields.locked", { slot: slot + 1, field: fieldLabel(field, lang), n: fieldBees(field) })}</Warning>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn(on.length > 0 && !locked.length ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
          {on.length > 0 ? s("fields.count", { n: on.length }) : s("fields.none")}
        </span>
        <Button variant="outline" size="sm" onClick={() => goTo("gather")}>
          {s("fields.more")}
        </Button>
      </div>
    </Step>
  )
}

export default function GuidePage() {
  const { t } = useI18n()
  const s = useStrings(strings)
  const { settings, saveGeneral } = useSettings()
  const { status: perms, refresh: refreshPerms } = usePermissions()
  const { status: ocr, install: installOcr, error: ocrError } = useOcrStatus()
  const permsOk = !!perms && perms.accessibility !== false && perms.screenRecording !== false && !perms.fullKeyboardAccess

  const startMode = readStartMode(settings)
  const [hiveSlot, setHiveSlot] = useState<number | null>(null)
  const privateServer = String(useSetting<string>("private_server_link", "") ?? "").trim()
  const { on: fieldsOn, locked: fieldsLocked } = useFieldPlan()
  const startKey = keybindDisplay(useSetting<string>("start_keybind", "F1") || "F1")
  const pauseKey = keybindDisplay(useSetting<string>("pause_keybind", "F2") || "F2")
  const stopKey = keybindDisplay(useSetting<string>("stop_keybind", "F3") || "F3")

  // Windows needs no permissions; its first step adds English OCR instead (unless the
  // app is too old to check it). A check that can't run doesn't count as a step to do.
  const showOcr = isWindows && ocr !== null
  const ocrKnown = !!ocr && !ocr.installing && ocr.installed !== null
  const first = isMac || showOcr ? 1 : 0
  const loaded = !!settings
  const flag = (id: string) => (loaded ? settings[id] === true : undefined)
  const langDone = flag("guide_lang_done")
  const displayDone = flag("guide_display_done")
  const playerDone = flag("guide_player_done")
  const fieldsDone = loaded ? fieldsOn.length > 0 && fieldsLocked.length === 0 : undefined
  const hiveDone = loaded ? startMode.done : undefined

  // in page order; the private server is optional
  const checks: { key: string; n: number; title: string; done: boolean | undefined }[] = [
    ...(isMac ? [{ key: "perm", n: 1, title: s("perm.title"), done: perms ? permsOk : undefined }] : []),
    ...(showOcr && ocrKnown ? [{ key: "ocr", n: 1, title: s("ocr.title"), done: ocr.installed === true }] : []),
    { key: "lang", n: first + 1, title: s("lang.title"), done: langDone },
    { key: "display", n: first + 2, title: s("display.title"), done: displayDone },
    { key: "player", n: first + 3, title: s("player.title"), done: playerDone },
    { key: "hive", n: first + 5, title: s("hive.title"), done: hiveDone },
    { key: "fields", n: first + 6, title: s("fields.title"), done: fieldsDone },
  ]
  const doneCount = checks.filter((c) => c.done).length
  const next = checks.find((c) => c.done === false)

  return (
    <Page
      title={t("nav.guide")}
      description={s("subtitle")}
      actions={
        loaded ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <Progress value={(doneCount / checks.length) * 100} className="h-1.5 w-24 [&>*]:duration-500" aria-label={s("progress", { done: doneCount, total: checks.length })} />
            <Badge variant={next ? "secondary" : "outline"} className={cn(!next && "text-emerald-600 dark:text-emerald-400")}>
              {s("progress", { done: doneCount, total: checks.length })}
            </Badge>
            {next ? (
              <Button size="sm" variant="outline" onClick={() => showStep(next.key)}>
                <ArrowDownIcon />
                {s("next")} · {next.n}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => showStep("start")}>
                <ArrowDownIcon />
                {s("allDone")}
              </Button>
            )}
          </div>
        ) : null
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {isMac && (
            <Step stepKey="perm" n={1} icon={<ShieldCheckIcon />} title={s("perm.title")} done={perms ? permsOk : undefined}>
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

          {showOcr && (
            <Step stepKey="ocr" n={1} icon={<ScanTextIcon />} title={s("ocr.title")} done={ocrKnown ? ocr.installed === true : undefined}>
              <p>{s("ocr.body")}</p>
              <OcrRow status={ocr} onInstall={() => void installOcr()} />
              {ocr?.installing && <OcrProgress status={ocr} />}
              {ocr && !ocr.installing && ocr.installed !== true && (
                <>
                  <p className={cn("text-xs", ocrError && "text-amber-700 dark:text-amber-300")}>
                    {s(ocrError === "cancelled" ? "ocr.cancelled" : ocrError ? "ocr.failed" : "ocr.note")}
                  </p>
                  {ocrError === "failed" && <OcrLog lines={ocr.log} />}
                </>
              )}
            </Step>
          )}

          <Step stepKey="lang" n={first + 1} icon={<LanguagesIcon />} title={s("lang.title")} done={langDone}>
            <p>{s("lang.body")}</p>
            <Warning>{s("lang.how")}</Warning>
            <div className="flex flex-wrap items-center gap-2">
              <MarkDone settingId="guide_lang_done" />
              <DocLink doc="display-settings" />
            </div>
          </Step>

          <Step stepKey="display" n={first + 2} icon={<MonitorIcon />} title={s("display.title")} done={displayDone}>
            <p>{s("display.body")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <MarkDone settingId="guide_display_done" />
              <DocLink doc="display-settings" />
            </div>
          </Step>

          <PlayerStep n={first + 3} done={playerDone} />

          <Step stepKey="game" n={first + 4} icon={<GamepadIcon />} title={s("game.title")} done={privateServer ? true : undefined} optional>
            <p>{s("game.body")}</p>
            <div className="rounded-lg border bg-muted/30 px-3">
              <SettingRowLayout htmlFor="private_server_link" title={s("game.ps")} desc={s("game.psHow")} stacked>
                <TextControl
                  id="private_server_link"
                  value={settings?.private_server_link ?? ""}
                  onCommit={(v) => void saveGeneral("private_server_link", v)}
                  width={32}
                  placeholder="https://www.roblox.com/share?code=..."
                />
              </SettingRowLayout>
            </div>
          </Step>

          <Step stepKey="hive" n={first + 5} icon={<HomeIcon />} title={s("hive.title")} done={hiveDone}>
            <p>{s("hive.body")}</p>
            <StartModeChooser
              mode={startMode.mode}
              slot={hiveSlot ?? startMode.slot}
              onChange={(mode, slot) => {
                setHiveSlot(slot)
                if (mode) void saveStartMode(saveGeneral, mode, slot)
              }}
            />
          </Step>

          <FieldStep n={first + 6} done={fieldsDone} />

          <Step stepKey="start" n={first + 7} icon={<KeyboardIcon />} title={s("start.title")}>
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
                {(["tips.1", "tips.2", "tips.3", "tips.4", "tips.5"] as const).map((k) => (
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
