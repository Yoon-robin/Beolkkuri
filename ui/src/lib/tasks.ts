// Builds the Home task list from settings, mirroring the order the macro runs tasks in.
import type { Settings } from "./py"
import {
  BOOSTER_EMOJI,
  COLLECT_EMOJI,
  COLLECT_KO,
  KILL_EMOJI,
  KILL_KO,
  QUEST_EMOJI,
  QUEST_KO,
  fieldLabel,
  titleCase,
} from "./game-data"

type Lang = "ko" | "en"
export type TaskKind = "gather" | "collect" | "buff" | "kill" | "quest" | "blender" | "planters" | "mode"
export type TaskItem = { id: string; kind: string; label: string }

const KIND: Record<TaskKind, { ko: string; en: string }> = {
  gather: { ko: "채집", en: "Gather" },
  collect: { ko: "수집", en: "Collect" },
  buff: { ko: "버프", en: "Buff" },
  kill: { ko: "사냥", en: "Kill" },
  quest: { ko: "퀘스트", en: "Quest" },
  blender: { ko: "블렌더", en: "Blender" },
  planters: { ko: "플랜터", en: "Planters" },
  mode: { ko: "모드", en: "Mode" },
}

const name = (key: string, ko: Record<string, string>, lang: Lang) =>
  lang === "ko" && ko[key] ? ko[key] : titleCase(key.replaceAll("_", " "))

const icon = (file: string) => `<img src="./assets/icons/${file}.png">`

export function buildTaskList(s: Settings, lang: Lang): TaskItem[] {
  const out: TaskItem[] = []
  const add = (id: string, kind: TaskKind, label: string, kindLabel?: string) =>
    out.push({ id, kind: kindLabel ?? KIND[kind][lang], label })
  const fields = (s.fields as string[]) ?? []
  const enabled = (s.fields_enabled as boolean[]) ?? []
  const order = (s.task_priority_order as string[]) ?? []
  const fieldFromTask = (taskId: string) => taskId.replace("gather_", "").replace("_", " ")
  const isEnabledField = (field: string) => fields.some((f, i) => enabled[i] && f === field)

  const killLabel = (mob: string) => `${KILL_EMOJI[mob] ?? ""} ${name(mob === "rhinobeetle" ? "rhino_beetle" : mob, KILL_KO, lang)}`.trim()

  switch (s.macro_mode) {
    case "alt":
      add("alt", "mode", lang === "ko" ? "메인 계정이 정해 준 필드에서 계속 채집" : "Gathers the host-assigned field indefinitely")
      return out
    case "field": {
      let ids = order.filter((id) => id.startsWith("gather_") && isEnabledField(fieldFromTask(id)))
      if (!ids.length) ids = fields.filter((_, i) => enabled[i]).map((f) => `gather_${f.replaceAll(" ", "_")}`)
      ids.forEach((id, i) => add(id, "gather", fieldLabel(fieldFromTask(id), lang), `${KIND.gather[lang]} ${i + 1}`))
      return out
    }
    case "quest":
      for (const q of ["honey_bee", "bucko_bee", "riley_bee", "polar_bear", "brown_bear", "black_bear"]) {
        if (s[`${q}_quest`]) add(`quest_${q}`, "quest", `${QUEST_EMOJI[q]} ${name(q, QUEST_KO, lang)}`)
      }
      return out
    case "bug":
      for (const id of order) {
        if (id === "ant_challenge" || id === "stinger_hunt") {
          if (s[id]) add(id, "kill", killLabel(id))
        } else if (id.startsWith("kill_") && s[id.slice(5)]) add(id, "kill", killLabel(id.slice(5)))
      }
      return out
  }

  const describe = (id: string): [TaskKind, string] | null => {
    if (id.startsWith("collect_")) {
      const key = id.slice(8)
      if (key === "sticker_printer") return s.sticker_printer ? ["collect", `${COLLECT_EMOJI.sticker_printer} ${name(key, COLLECT_KO, lang)}`] : null
      if (key === "sticker_stack") return s.sticker_stack ? ["buff", `${icon("sticker_stack")}${name(key, COLLECT_KO, lang)}`] : null
      if (key === "sprouts") return s.sprouts_enable ? ["collect", `🌱 ${name(key, COLLECT_KO, lang)}`] : null
      if (key === "sticker_sprout") return s.sticker_sprout_watch ? ["collect", `🌱 ${name(key, COLLECT_KO, lang)}`] : null
      if (key in BOOSTER_EMOJI) return s[key] ? ["buff", `${BOOSTER_EMOJI[key]} ${name(key, COLLECT_KO, lang)}`] : null
      return s[key] ? ["collect", `${COLLECT_EMOJI[key] ?? ""} ${name(key, COLLECT_KO, lang)}`.trim()] : null
    }
    if (id.startsWith("kill_")) return s[id.slice(5)] ? ["kill", killLabel(id.slice(5))] : null
    if (id.startsWith("quest_")) {
      const q = id.slice(6)
      return s[`${q}_quest`] ? ["quest", `${QUEST_EMOJI[q] ?? ""} ${name(q, QUEST_KO, lang)}`] : null
    }
    switch (id) {
      case "blender": {
        if (!s.blender_enable) return null
        const items = [1, 2, 3, 4, 5]
          .map((i) => String(s[`blender_item_${i}`] ?? "").replaceAll(" ", "_"))
          .filter((x) => x && x !== "none")
        return ["blender", items.length ? items.map((x) => `${icon(x)}${titleCase(x.replaceAll("_", " "))}`).join(", ") : "—"]
      }
      case "planters":
        if (!s.planters_mode) return null
        return ["planters", Number(s.planters_mode) === 1 ? (lang === "ko" ? "수동" : "Manual") : lang === "ko" ? "자동" : "Auto"]
      case "mondo_buff":
        return s.mondo_buff ? ["collect", `${COLLECT_EMOJI.mondo_buff} ${name("mondo_buff", COLLECT_KO, lang)}`] : null
      case "stinger_hunt":
      case "ant_challenge":
        return s[id] ? ["kill", killLabel(id)] : null
      case "auto_field_boost":
        return s.Auto_Field_Boost ? ["buff", `🎲 ${lang === "ko" ? "자동 필드 부스트" : "Auto Field Boost"}`] : null
    }
    return null
  }

  for (const id of order) {
    if (id.startsWith("gather_")) {
      const field = fieldFromTask(id)
      fields.forEach((f, i) => {
        if (enabled[i] && f === field) add(id, "gather", fieldLabel(f, lang), `${KIND.gather[lang]} ${i + 1}`)
      })
    } else {
      const info = describe(id)
      if (info) add(id, info[0], info[1])
    }
  }

  // no saved priority order yet: list enabled fields so the user still sees something
  if (!order.length) fields.forEach((f, i) => enabled[i] && add(`gather_${i}`, "gather", fieldLabel(f, lang), `${KIND.gather[lang]} ${i + 1}`))
  return out
}
