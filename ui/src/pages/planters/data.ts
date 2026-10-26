// Planter / nectar / field tables for the planters and boost pages.
import { FIELD_EMOJI, FIELD_KO, FIELD_NECTAR, titleCase } from "@/lib/game-data"

import type { PickerOption } from "./common"

/** Planter keys exactly as the old UI used them in setting ids (`auto_planter_<key>`). */
export const PLANTERS = [
  "paper",
  "ticket",
  "festive",
  "sticker",
  "plastic",
  "candy",
  "red_clay",
  "blue_clay",
  "tacky",
  "pesticide",
  "heat-treated",
  "hydroponic",
  "petal",
  "planter_of_plenty",
] as const

const PLANTER_KO: Record<string, string> = {
  paper: "종이",
  ticket: "티켓",
  festive: "축제",
  sticker: "스티커",
  plastic: "플라스틱",
  candy: "사탕",
  red_clay: "빨간 점토",
  blue_clay: "파란 점토",
  tacky: "끈적이",
  pesticide: "살충제",
  "heat-treated": "열처리",
  hydroponic: "수경재배",
  petal: "꽃잎",
  planter_of_plenty: "풍요의",
}

export const NECTARS = ["comforting", "motivating", "satisfying", "refreshing", "invigorating"] as const

const NECTAR_KO: Record<string, string> = {
  comforting: "편안함",
  motivating: "동기부여",
  satisfying: "만족감",
  refreshing: "상쾌함",
  invigorating: "활력",
}

/** Field keys in the old dropdown order (underscore form). */
export const FIELDS = Object.keys(FIELD_NECTAR)

type Lang = "ko" | "en"

export const icon = (name: string) => `./assets/icons/${name}.png`

/** "planter of plenty" / "planter_of_plenty" -> "planter_of_plenty" (the old canonicalPlanterKey). */
export const planterKey = (p: unknown) => String(p ?? "").trim().toLowerCase().replaceAll(" ", "_")

export function planterName(key: string, lang: Lang) {
  const k = planterKey(key)
  if (lang === "ko") return PLANTER_KO[k] ? `${PLANTER_KO[k]} 플랜터` : k
  return titleCase(k.replaceAll("_", " "))
}

export function nectarName(nectar: string, lang: Lang) {
  return lang === "ko" ? (NECTAR_KO[nectar] ?? nectar) : titleCase(nectar)
}

export function fieldName(field: string, lang: Lang) {
  const k = field.replaceAll(" ", "_")
  return lang === "ko" ? (FIELD_KO[k] ?? titleCase(field)) : titleCase(k.replaceAll("_", " "))
}

/** Compare saved field/planter values regardless of "_" vs " " (the old UI wrote both forms). */
export const sameKey = (saved: unknown, option: string) => planterKey(saved) === planterKey(option)

/** Planter dropdown: values are what the old image dropdown saved ("red clay", "none"). */
export function planterOptions(lang: Lang, noneLabel: string): PickerOption[] {
  return [
    { value: "none", label: noneLabel },
    ...PLANTERS.map((p) => ({ value: p.replaceAll("_", " "), label: planterName(p, lang), image: icon(`${p}_planter`) })),
  ]
}

/**
 * Field dropdown. `form` picks the saved value format: the planters tab saved
 * "pine tree" while the boost tab's plain field list saved "pine_tree".
 */
export function fieldOptions(lang: Lang, noneLabel: string, form: "space" | "underscore"): PickerOption[] {
  return [
    { value: "none", label: noneLabel },
    ...FIELDS.map((f) => ({
      value: form === "space" ? f.replaceAll("_", " ") : f,
      label: fieldName(f, lang),
      emoji: FIELD_EMOJI[f],
      badge: FIELD_NECTAR[f] ? icon(FIELD_NECTAR[f]!) : undefined,
    })),
  ]
}

export function nectarOptions(lang: Lang): PickerOption[] {
  return NECTARS.map((n) => ({ value: n, label: nectarName(n, lang), image: icon(n) }))
}

/** Hive-colour presets copied from the old changePreset(). */
export const PRESETS: Record<string, Record<string, string | number | boolean>> = {
  blue: {
    auto_priority_0_nectar: "comforting",
    auto_priority_1_nectar: "motivating",
    auto_priority_2_nectar: "satisfying",
    auto_priority_3_nectar: "refreshing",
    auto_priority_4_nectar: "invigorating",
    auto_priority_0_min: 70,
    auto_priority_1_min: 80,
    auto_priority_2_min: 80,
    auto_priority_3_min: 80,
    auto_priority_4_min: 40,
    auto_field_sunflower: true,
    auto_field_dandelion: true,
    auto_field_mushroom: false,
    auto_field_blue_flower: true,
    auto_field_clover: true,
    auto_field_strawberry: true,
    auto_field_spider: true,
    auto_field_bamboo: false,
    auto_field_pineapple: true,
    auto_field_stump: false,
    auto_field_cactus: true,
    auto_field_pumpkin: false,
    auto_field_pine_tree: true,
    auto_field_rose: true,
    auto_field_mountain_top: false,
    auto_field_pepper: true,
    auto_field_coconut: false,
  },
  red: {
    auto_priority_0_nectar: "invigorating",
    auto_priority_1_nectar: "refreshing",
    auto_priority_2_nectar: "motivating",
    auto_priority_3_nectar: "satisfying",
    auto_priority_4_nectar: "comforting",
    auto_priority_0_min: 70,
    auto_priority_1_min: 80,
    auto_priority_2_min: 80,
    auto_priority_3_min: 80,
    auto_priority_4_min: 40,
    auto_field_sunflower: true,
    auto_field_dandelion: true,
    auto_field_mushroom: false,
    auto_field_blue_flower: true,
    auto_field_clover: true,
    auto_field_strawberry: true,
    auto_field_spider: true,
    auto_field_bamboo: true,
    auto_field_pineapple: true,
    auto_field_stump: false,
    auto_field_cactus: true,
    auto_field_pumpkin: true,
    auto_field_pine_tree: true,
    auto_field_rose: true,
    auto_field_mountain_top: false,
    auto_field_pepper: true,
    auto_field_coconut: false,
  },
  white: {
    auto_priority_0_nectar: "satisfying",
    auto_priority_1_nectar: "motivating",
    auto_priority_2_nectar: "refreshing",
    auto_priority_3_nectar: "comforting",
    auto_priority_4_nectar: "invigorating",
    auto_priority_0_min: 70,
    auto_priority_1_min: 80,
    auto_priority_2_min: 80,
    auto_priority_3_min: 80,
    auto_priority_4_min: 40,
    auto_field_sunflower: true,
    auto_field_dandelion: true,
    auto_field_mushroom: false,
    auto_field_blue_flower: true,
    auto_field_clover: true,
    auto_field_strawberry: true,
    auto_field_spider: true,
    auto_field_bamboo: true,
    auto_field_pineapple: true,
    auto_field_stump: false,
    auto_field_cactus: true,
    auto_field_pumpkin: false,
    auto_field_pine_tree: true,
    auto_field_rose: true,
    auto_field_mountain_top: false,
    auto_field_pepper: true,
    auto_field_coconut: false,
  },
}
