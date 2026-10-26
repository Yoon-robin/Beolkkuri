// Task priority order helpers, ported from the legacy drag list in script.js.
//
// Quests and planters are "locked": the user can't move them, and they stay
// anchored at the same position relative to the movable tasks around them.
import type { Settings } from "@/lib/py"
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
} from "@/lib/game-data"

export const isLockedTask = (id: string) => !!id && (id.startsWith("quest_") || id === "planters")

/** Keep every quest_* entry together, at the position of the first one. */
export function normalizeGrouping(orderArray: string[]) {
  const order = orderArray.slice()
  const quests = order.filter((id) => id.startsWith("quest_"))
  if (!quests.length) return order
  const firstQuestIdx = order.findIndex((id) => id.startsWith("quest_"))
  const insertAt = order.slice(0, firstQuestIdx).filter((id) => !id.startsWith("quest_")).length
  const withoutQuests = order.filter((id) => !id.startsWith("quest_"))
  withoutQuests.splice(insertAt, 0, ...quests)
  return withoutQuests
}

export type LockState = {
  /** Normalized full order. */
  order: string[]
  /** Number of movable tasks that come before the quest group / planters. */
  questAnchor: number | null
  planterAnchor: number | null
  questBeforePlanter: boolean
  questIds: string[]
  hasPlanters: boolean
}

export function lockStateOf(orderArray: string[]): LockState {
  const order = normalizeGrouping(orderArray)
  let unlockedCount = 0
  let questAnchor: number | null = null
  let planterAnchor: number | null = null
  let questBeforePlanter = true
  let seenQuest = false
  let seenPlanter = false

  for (const id of order) {
    if (id.startsWith("quest_")) {
      if (questAnchor === null) {
        questAnchor = unlockedCount
        if (seenPlanter) questBeforePlanter = false
      }
      seenQuest = true
      continue
    }
    if (id === "planters") {
      if (planterAnchor === null) {
        planterAnchor = unlockedCount
        if (!seenQuest) questBeforePlanter = false
      }
      seenPlanter = true
      continue
    }
    unlockedCount += 1
  }

  return {
    order,
    questAnchor,
    planterAnchor,
    questBeforePlanter,
    questIds: order.filter((id) => id.startsWith("quest_")),
    hasPlanters: order.includes("planters"),
  }
}

/**
 * Re-insert the locked groups around a (re)ordered list of movable tasks.
 * `questItems` / `planterItems` are what gets inserted for each group, so the
 * same routine builds the saved order and the rendered rows (with headers).
 */
export function mergeWithLocks<T>(unlocked: T[], lock: LockState, questItems: T[], planterItems: T[]): T[] {
  const out: T[] = []
  let index = 0
  let questsInserted = !lock.questIds.length
  let planterInserted = !lock.hasPlanters

  const insertQuests = () => {
    out.push(...questItems)
    questsInserted = true
  }
  const insertPlanter = () => {
    out.push(...planterItems)
    planterInserted = true
  }
  const maybeInsertLocked = () => {
    const atQuest = !questsInserted && lock.questAnchor !== null && index === lock.questAnchor
    const atPlanter = !planterInserted && lock.planterAnchor !== null && index === lock.planterAnchor
    if (atQuest && atPlanter) {
      if (lock.questBeforePlanter) {
        insertQuests()
        insertPlanter()
      } else {
        insertPlanter()
        insertQuests()
      }
    } else if (atQuest) insertQuests()
    else if (atPlanter) insertPlanter()
  }

  while (index < unlocked.length) {
    maybeInsertLocked()
    out.push(unlocked[index])
    index += 1
  }
  maybeInsertLocked()
  if (!questsInserted) insertQuests()
  if (!planterInserted) insertPlanter()
  return out
}

/** Same rules as the legacy window._isTaskEnabledForSettings (greys out tasks that won't run). */
export function isTaskEnabled(taskId: string, s: Settings): boolean {
  if (!taskId) return false
  if (taskId.startsWith("gather_")) {
    const fieldName = taskId.replace("gather_", "").replace("_", " ")
    const fields = Array.isArray(s.fields) ? (s.fields as unknown[]) : []
    const enabled = Array.isArray(s.fields_enabled) ? (s.fields_enabled as unknown[]) : []
    return enabled.some((on, i) => !!on && fields[i] === fieldName)
  }
  if (taskId.startsWith("collect_")) {
    const name = taskId.replace("collect_", "")
    if (name === "sprouts") return !!s.sprouts_enable
    if (name === "sticker_sprout") return !!s.sticker_sprout_watch
    return !!s[name]
  }
  if (taskId.startsWith("kill_")) return !!s[taskId.replace("kill_", "")]
  if (taskId.startsWith("quest_")) return !!s[`${taskId.replace("quest_", "")}_quest`]
  switch (taskId) {
    case "mondo_buff":
    case "stinger_hunt":
    case "ant_challenge":
      return !!s[taskId]
    case "auto_field_boost":
      // the setting is saved as Auto_Field_Boost; the old list only looked at the
      // lower-case key, so the task always looked disabled
      return !!(s.Auto_Field_Boost ?? s.auto_field_boost)
    case "blender":
      return !!(s.blender_enable || s.blender)
    case "planters": {
      const mode = Number(s.planters_mode)
      return !!s.planters || (Number.isFinite(mode) && mode > 0)
    }
  }
  return false
}

export type TaskCategory = "gather" | "collect" | "kill" | "quest" | "special"

export function taskCategory(id: string): TaskCategory {
  if (id.startsWith("gather_")) return "gather"
  if (id.startsWith("collect_")) return "collect"
  if (id.startsWith("kill_")) return "kill"
  if (id.startsWith("quest_")) return "quest"
  return "special"
}

const EN_NAMES: Record<string, string> = {
  gingerbread: "Gingerbread House",
  rhinobeetle: "Rhinobeetle",
}

const named = (key: string, ko: Record<string, string>, lang: "ko" | "en") =>
  lang === "ko" && ko[key] ? ko[key] : (EN_NAMES[key] ?? titleCase(key.replaceAll("_", " ")))

const withIcon = (icon: string, name: string) => (icon ? `${icon} ${name}` : name)

/** Display label for a task id (may contain an <img> icon; render with RichText). */
export function taskLabel(id: string, lang: "ko" | "en"): string {
  if (id.startsWith("gather_")) return fieldLabel(id.slice("gather_".length), lang)
  if (id.startsWith("collect_")) {
    const key = id.slice("collect_".length)
    if (key === "sticker_stack") return `<img src="./assets/icons/sticker_stack.png" alt="">${named(key, COLLECT_KO, lang)}`
    const icon = BOOSTER_EMOJI[key] ?? COLLECT_EMOJI[key] ?? (key === "sprouts" || key === "sticker_sprout" ? "🌱" : "")
    return withIcon(icon, named(key, COLLECT_KO, lang))
  }
  if (id.startsWith("kill_")) {
    const key = id.slice("kill_".length)
    return withIcon(KILL_EMOJI[key] ?? "", named(key, KILL_KO, lang))
  }
  if (id.startsWith("quest_")) {
    const key = id.slice("quest_".length)
    return withIcon(QUEST_EMOJI[key] ?? "", named(key, QUEST_KO, lang))
  }
  switch (id) {
    case "mondo_buff":
      return withIcon(COLLECT_EMOJI.mondo_buff ?? "", named(id, COLLECT_KO, lang))
    case "stinger_hunt":
    case "ant_challenge":
      return withIcon(KILL_EMOJI[id] ?? "", named(id, KILL_KO, lang))
    case "auto_field_boost":
      return withIcon("🎲", lang === "ko" ? "자동 필드 부스트" : "Auto Field Boost")
    case "blender":
      return withIcon("🧪", lang === "ko" ? "블렌더" : "Blender")
    case "planters":
      return withIcon("🪴", lang === "ko" ? "플랜터" : "Planters")
  }
  return titleCase(id.replaceAll("_", " "))
}
