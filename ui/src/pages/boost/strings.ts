import type { PageStrings } from "@/i18n"

const ko = {
  subtitle: "핫바 아이템, 필드 부스터, 스티커 스택 같은 버프를 관리해요.",

  hotbarTitle: "핫바 자동 사용",
  hotbarDesc: "아래 핫바에서 칸을 골라, 그 칸의 아이템을 언제 얼마나 자주 쓸지 정해요.",
  slot: "{n}번 칸",
  slotDesc: "이 핫바 칸을 언제 쓸지 정해요.",
  useWhen: "언제 쓸까요?",
  useWhenDesc: "이 칸을 써도 되는 상황을 골라요.",
  "when.never": "안 씀",
  "when.always": "항상",
  "when.gathering": "채집할 때",
  "when.converting": "꿀 변환할 때",
  "when.attacking": "몹 잡을 때",
  useEvery: "사용 간격",
  useEveryDesc: "한 번 쓴 뒤 다시 쓰기까지 기다릴 시간이에요.",
  secs: "초",
  mins: "분",
  secsLabel: "초",
  minsLabel: "분",
  every: "{value}{unit}마다",
  off: "꺼짐",

  glitterSlot0: "0 (인벤토리에서 찾기)",
  afbReset: "초기화",
  afbResetTitle: "AFB 기록을 초기화할까요?",
  afbResetDesc: "주사위와 글리터를 마지막으로 쓴 시간 기록을 지워요. 다음 AFB는 처음부터 다시 시작해요.",
  afbResetDone: "AFB 기록을 초기화했어요",
  copySettings: "설정 복사",
  copied: "{field} 필드의 채집 설정을 부계정용으로 복사했어요",
  copyFailed: "복사하지 못했어요. {field} 필드 설정을 찾을 수 없어요.",
  patternsFailed: "패턴 목록을 불러오지 못했어요",
}

type K = keyof typeof ko

export const strings: PageStrings<K> = {
  ko,
  en: {
    subtitle: "Manage hotbar items, field boosters, the sticker stack and other buffs.",

    hotbarTitle: "Hotbar",
    hotbarDesc: "Pick a slot on the bar, then choose when and how often to use it.",
    slot: "Slot {n}",
    slotDesc: "Choose when to use this hotbar slot.",
    useWhen: "Use when",
    useWhenDesc: "When this slot is allowed to be used.",
    "when.never": "Never",
    "when.always": "Always",
    "when.gathering": "Gathering",
    "when.converting": "Converting",
    "when.attacking": "Attacking",
    useEvery: "Use every",
    useEveryDesc: "How long to wait before using this slot again.",
    secs: "s",
    mins: "m",
    secsLabel: "Secs",
    minsLabel: "Mins",
    every: "every {value}{unit}",
    off: "Off",

    glitterSlot0: "0 (find in inventory)",
    afbReset: "Reset",
    afbResetTitle: "Reset AFB timings?",
    afbResetDesc: "Clears when Dice and Glitter were last used. The next AFB run starts fresh.",
    afbResetDone: "AFB timings reset",
    copySettings: "Copy settings",
    copied: "Copied your {field} settings to the alt preset",
    copyFailed: "Copy failed. No settings found for {field}.",
    patternsFailed: "Couldn't load patterns",
  },
}
