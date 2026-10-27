// Bee Swarm Simulator lookup tables shared by several pages.

export const FIELD_EMOJI: Record<string, string> = {
  sunflower: "🌻",
  dandelion: "🌼",
  mushroom: "🍄",
  blue_flower: "🔷",
  clover: "🍀",
  strawberry: "🍓",
  spider: "🕸️",
  bamboo: "🐼",
  pineapple: "🍍",
  stump: "🐌",
  cactus: "🌵",
  pumpkin: "🎃",
  pine_tree: "🌲",
  rose: "🌹",
  mountain_top: "⛰️",
  pepper: "🌶️",
  coconut: "🥥",
  hive_hub: "🏠",
}

export const FIELD_KO: Record<string, string> = {
  sunflower: "해바라기",
  dandelion: "민들레",
  mushroom: "버섯",
  blue_flower: "파란 꽃",
  clover: "클로버",
  strawberry: "딸기",
  spider: "거미",
  bamboo: "대나무",
  pineapple: "파인애플",
  stump: "그루터기",
  cactus: "선인장",
  pumpkin: "호박",
  pine_tree: "소나무",
  rose: "장미",
  mountain_top: "산 정상",
  pepper: "고추",
  coconut: "코코넛",
  hive_hub: "하이브 허브",
}

export const COLLECT_EMOJI: Record<string, string> = {
  wealth_clock: "🕒",
  honey_dispenser: "🍯",
  blueberry_dispenser: "🔵",
  strawberry_dispenser: "🍓",
  coconut_dispenser: "🥥",
  royal_jelly_dispenser: "💎",
  treat_dispenser: "🦴",
  ant_pass_dispenser: "🎫",
  buy_ant_pass: "🎟️",
  robo_pass_dispenser: "🤖",
  glue_dispenser: "🧴",
  stockings: "🧦",
  feast: "🍽️",
  gingerbread: "🍪",
  samovar: "🏺",
  snow_machine: "❄️",
  lid_art: "🖼️",
  candles: "🕯️",
  wreath: "🎄",
  gummy_beacon: "💜",
  sticker_printer: "🖨️",
  mondo_buff: "🐣",
  memory_match: "🍍",
  mega_memory_match: "🌟",
  extreme_memory_match: "🌶️",
  winter_memory_match: "❄️",
  wind_shrine: "🌬️",
  honeystorm: "🟧",
}

export const COLLECT_KO: Record<string, string> = {
  wealth_clock: "부의 시계",
  honey_dispenser: "꿀 디스펜서",
  blueberry_dispenser: "블루베리 디스펜서",
  strawberry_dispenser: "딸기 디스펜서",
  coconut_dispenser: "코코넛 디스펜서",
  royal_jelly_dispenser: "로열 젤리 디스펜서",
  treat_dispenser: "간식 디스펜서",
  ant_pass_dispenser: "개미 패스 디스펜서",
  buy_ant_pass: "개미 패스 구매",
  robo_pass_dispenser: "로보 패스 디스펜서",
  glue_dispenser: "글루 디스펜서",
  stockings: "양말",
  feast: "만찬",
  gingerbread: "진저브레드 하우스",
  samovar: "사모바르",
  snow_machine: "눈 기계",
  lid_art: "뚜껑 아트",
  candles: "양초",
  wreath: "꿀 화환",
  gummy_beacon: "구미 비콘",
  sticker_printer: "스티커 프린터",
  sticker_stack: "스티커 스택",
  mondo_buff: "몬도 버프",
  memory_match: "메모리 매치",
  mega_memory_match: "메가 메모리 매치",
  extreme_memory_match: "익스트림 메모리 매치",
  winter_memory_match: "겨울 메모리 매치",
  wind_shrine: "바람 신전",
  honeystorm: "꿀 폭풍",
  sprouts: "새싹",
  sticker_sprout: "스티커 새싹",
  blue_booster: "파란 부스터",
  red_booster: "빨간 부스터",
  mountain_booster: "산 정상 부스터",
}

export const KILL_EMOJI: Record<string, string> = {
  stinger_hunt: "😈",
  ant_challenge: "🎯",
  stump_snail: "🐌",
  ladybug: "🐞",
  rhinobeetle: "🪲",
  scorpion: "🦂",
  mantis: "🦗",
  spider: "🕷️",
  werewolf: "🐺",
  coconut_crab: "🦀",
  king_beetle: "👑",
  tunnel_bear: "🐻",
}

export const KILL_KO: Record<string, string> = {
  stinger_hunt: "스팅어 헌트",
  ant_challenge: "개미 챌린지",
  stump_snail: "그루터기 달팽이",
  ladybug: "무당벌레",
  rhinobeetle: "장수풍뎅이",
  scorpion: "전갈",
  mantis: "사마귀",
  spider: "거미",
  werewolf: "늑대인간",
  coconut_crab: "코코넛 게",
  king_beetle: "킹 비틀",
  tunnel_bear: "터널 곰",
}

export const QUEST_EMOJI: Record<string, string> = {
  polar_bear: "🐻‍❄️",
  brown_bear: "🐻",
  black_bear: "🐻",
  honey_bee: "🐝",
  bucko_bee: "💙",
  riley_bee: "❤️",
}

export const QUEST_KO: Record<string, string> = {
  polar_bear: "북극곰",
  brown_bear: "갈색곰",
  black_bear: "흑곰",
  honey_bee: "허니 비",
  bucko_bee: "버코 비",
  riley_bee: "라일리 비",
}

export const BOOSTER_EMOJI: Record<string, string> = {
  blue_booster: "🔵",
  red_booster: "🔴",
  mountain_booster: "⚪",
}

/** Nectar each field produces (icon file name under assets/icons). */
export const FIELD_NECTAR: Record<string, string | null> = {
  sunflower: "satisfying",
  dandelion: "comforting",
  mushroom: "motivating",
  blue_flower: "refreshing",
  clover: "invigorating",
  strawberry: "refreshing",
  spider: "motivating",
  bamboo: "comforting",
  pineapple: "satisfying",
  stump: "motivating",
  cactus: "invigorating",
  pumpkin: "satisfying",
  pine_tree: "comforting",
  rose: "motivating",
  mountain_top: "invigorating",
  pepper: "invigorating",
  coconut: "refreshing",
}

export const BLENDER_ICONS = [
  "red_extract",
  "blue_extract",
  "enzymes",
  "oil",
  "glue",
  "tropical_drink",
  "gumdrops",
  "moon_charm",
  "glitter",
  "star_jelly",
  "purple_potion",
  "soft_wax",
  "hard_wax",
  "swirled_wax",
  "caustic_wax",
  "field_dice",
  "smooth_dice",
  "loaded_dice",
  "super_smoothie",
  "turpentine",
]

export const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())

/** "pine tree" / "pine_tree" -> "pine_tree" */
export const fieldKey = (field: string) => String(field ?? "").toLowerCase().trim().replace(/\s+/g, "_")

export function fieldLabel(field: string, lang: "ko" | "en") {
  const key = fieldKey(field)
  const name = lang === "ko" ? (FIELD_KO[key] ?? titleCase(field)) : titleCase(String(field ?? "").replaceAll("_", " "))
  return `${FIELD_EMOJI[key] ?? ""} ${name}`.trim()
}
