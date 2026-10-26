// Gather tab constants and the per-field pattern preset logic, ported from the
// old gather.js so saved field objects stay identical.
import type { FieldSettings } from "@/lib/py"

export const SLOT_COUNT = 5

/** Field dropdown order (same as the old fieldEmojis table). Values are what the old UI saved. */
export const FIELD_OPTIONS = [
  "sunflower",
  "dandelion",
  "mushroom",
  "blue flower",
  "clover",
  "strawberry",
  "spider",
  "bamboo",
  "pineapple",
  "stump",
  "cactus",
  "pumpkin",
  "pine tree",
  "rose",
  "mountain top",
  "pepper",
  "coconut",
  "hive hub",
]

/** Every per-field value the old Gather tab read from its inputs. */
export const GATHER_FIELD_PROPS = [
  "shift_lock",
  "field_drift_compensation",
  "shape",
  "size",
  "width",
  "invert_lr",
  "invert_fb",
  "turn",
  "turn_times",
  "mins",
  "backpack",
  "infinite_gather",
  "return",
  "use_whirlwig_fallback",
  "start_location",
  "distance",
  "goo",
  "goo_interval",
  "blooms_ai_model",
] as const

export const ROBIN_AI_PATTERN = "robin_ai_gather"
export const BLOOMS_AI_PATTERN = "blooms_ai"

const DEFAULT_AI_PATTERN_GATHER_SETTINGS: FieldSettings = {
  start_location: "center",
  distance: 1,
  size: "m",
  width: 5,
  shift_lock: false,
  field_drift_compensation: true,
  invert_lr: false,
  invert_fb: false,
  turn: "none",
}

/** Fallback AI presets; replaced at runtime by getDefault*PatternPreset() from Python when available. */
export const FALLBACK_AI_PRESETS: Record<string, FieldSettings> = {
  [ROBIN_AI_PATTERN]: { ...DEFAULT_AI_PATTERN_GATHER_SETTINGS, shape: ROBIN_AI_PATTERN },
  [BLOOMS_AI_PATTERN]: { ...DEFAULT_AI_PATTERN_GATHER_SETTINGS, shape: BLOOMS_AI_PATTERN },
}

type Presets = Record<string, FieldSettings>

export function normalizeFieldData(data: FieldSettings | undefined): FieldSettings {
  return { ...(data && typeof data === "object" ? data : {}), infinite_gather: Boolean(data?.infinite_gather) }
}

function presetsOf(data: FieldSettings): Presets {
  const p = data.pattern_presets
  return p && typeof p === "object" && !Array.isArray(p) ? { ...(p as Presets) } : {}
}

/** The values the old UI collected from its inputs (generateSettingObject) + the presets. */
function snapshot(data: FieldSettings): FieldSettings {
  const out: FieldSettings = {}
  for (const k of GATHER_FIELD_PROPS) if (data[k] !== undefined) out[k] = data[k]
  return out
}

/** rememberGatherPatternPreset: store the current values as the preset for `pattern`. */
export function rememberPreset(data: FieldSettings, pattern: unknown): FieldSettings {
  if (!pattern) return data
  const presets = presetsOf(data)
  presets[String(pattern)] = { ...snapshot(data), shape: pattern }
  return { ...data, pattern_presets: presets }
}

/** saveFieldPatternChange: switch shape, restoring that pattern's remembered settings. */
export function applyPatternChange(current: FieldSettings, selected: string, aiDefaults: Record<string, FieldSettings>) {
  const previous = current.shape
  let next: FieldSettings = rememberPreset({ ...current, shape: selected }, previous)
  const presets = presetsOf(next)
  const preset = presets[selected]
  if (preset && typeof preset === "object") {
    next = { ...next, ...preset, shape: selected, pattern_presets: presets }
  } else if (aiDefaults[selected]) {
    next = { ...next, ...aiDefaults[selected], shape: selected, pattern_presets: presets }
  } else {
    next = { ...next, shape: selected }
  }
  return rememberPreset(next, selected)
}

/** The old UI clamped goo_interval to at least 3 (an emptied box still saves 0). */
export function clampGooInterval(value: unknown) {
  if (typeof value === "string" && value !== "" && parseInt(value, 10) < 3) return "3"
  return value
}

// ---------------------------------------------------------------------------
// AI Gathering token lists (per detection model)

export const ROBIN_AI_TOKENS_STANDARD = [
  "Activated Target", "Baby Love", "Beamstorm", "Beesmas Cheer Token", "Black Bear Morph", "Bloom",
  "Blue Bomb Sync", "Blue Boost", "Blueberry", "Bomb", "Brown Bear Morph", "Coconut", "ComboCoconut",
  "Duped Baby Love", "Duped Beamstorm", "Duped Beesmas Cheer Token", "Duped Black Bear Morph",
  "Duped Blue Bomb Sync", "Duped Blue Boost", "Duped Blueberry", "Duped Bomb", "Duped Brown Bear Morph",
  "Duped Festive Blessing Token", "Duped Festive Gift Token", "Duped Festive Mark Token", "Duped Fetch",
  "Duped Flame Fuel", "Duped Focus", "Duped Fuzz Bombs Token", "Duped Glitch Token", "Duped Glob",
  "Duped Gumdrop Barrage", "Duped Haste", "Duped Honey Mark Token", "Duped Honey Token", "Duped Impale",
  "Duped Inferno Token", "Duped Inflate Balloons", "Duped Inspire Token", "Duped Jelly Bean",
  "Duped Map Corruption", "Duped Mark Surge Token", "Duped Melody", "Duped Mind Hack",
  "Duped Mother Bear Morph", "Duped Panda Bear Morph", "Duped Pineapple", "Duped Polar Bear Morph",
  "Duped Pollen Haze", "Duped Pollen Mark Token", "Duped Pulse", "Duped Puppy Love", "Duped Rage Token",
  "Duped Rain Cloud", "Duped Red Bomb Sync", "Duped Red Boost", "Duped Science Bear Morph", "Duped Scratch",
  "Duped Snowflake", "Duped Snowglobe Shake", "Duped Strawberry", "Duped Summon Frog Token",
  "Duped Sunflower Seed", "Duped Surprise Party", "Duped Tabby Love", "Duped Target Practice Token",
  "Duped Token Link", "Duped Tornado", "Duped Treat", "Duped Triangulate Token", "Duped White Boost",
  "Falling Star", "Festive Blessing Token", "Festive Gift Token", "Festive Mark Station",
  "Festive Mark Token", "Fetch", "Flame Fuel", "Focus", "Fully Collected Target", "Fuzz Bombs Token",
  "Glitch Token", "Glob", "Gumdrop Barrage", "Haste", "Honey Mark Station", "Honey Mark Token",
  "Honey Token", "Impale", "Inferno Token", "Inflate Balloons", "Inspire Token", "Jelly Bean",
  "Map Corruption", "Mark Surge Token", "Melody", "Mind Hack", "Mother Bear Morph", "Panda Bear Morph",
  "Pineapple", "Polar Bear Morph", "Pollen Haze", "Pollen Mark Station", "Pollen Mark Token",
  "Precise Mark Station", "Precise Mark Target", "Pulse", "Puppy Love", "Rage Token", "Rain Cloud",
  "Red Bomb Sync", "Red Boost", "Science Bear Morph", "Scratch", "Smiley", "Snowflake", "Snowglobe Shake",
  "Strawberry", "Summon Frog Token", "Sunflower Seed", "Surprise Party", "Tabby Love",
  "Target Practice Token", "TennisBall", "Token Link", "Tornado", "Treat", "Triangulate Token",
  "Unactivated Target", "White Boost",
]

export const ROBIN_AI_TOKENS_BY_MODEL: Record<string, string[]> = {
  Standard: ROBIN_AI_TOKENS_STANDARD,
  Light: [
    "Baby Love", "Bear Morph", "Bomb", "Boost", "Festive Gift Token", "Focus", "Summon Frog Token", "Fuzz Bombs Token",
    "Haste", "Honey Token", "Inflate Balloons", "Inspire Token", "Loot", "Mark", "Melody", "Party Balloons",
    "Tabby Love", "Token Link",
  ],
  Mini: [
    "Balloon", "Bear Morph", "Bomb", "Boost", "Summon Frog Token", "Haste", "Inspire Token", "Long Buff", "Loot",
    "Mark", "Token Link",
  ],
}

/** "light" -> "Light"; anything unknown falls back to Standard (like the old UI). */
export function robinAIModelName(setting: unknown) {
  const wanted = String(setting ?? "Standard").trim().toLowerCase()
  return Object.keys(ROBIN_AI_TOKENS_BY_MODEL).find((m) => m.toLowerCase() === wanted) ?? "Standard"
}

export const splitTokens = (value: unknown) =>
  String(value ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

/** getRobinAITokenState: preferred tokens first (in order), then the rest; ignored ones are off. */
export function tokenState(model: string, preferred: string, ignored: string) {
  const names = ROBIN_AI_TOKENS_BY_MODEL[model] ?? ROBIN_AI_TOKENS_STANDARD
  const off = new Set(splitTokens(ignored))
  const ordered: string[] = []
  for (const t of splitTokens(preferred)) if (names.includes(t) && !ordered.includes(t)) ordered.push(t)
  for (const t of names) if (!ordered.includes(t)) ordered.push(t)
  return ordered.map((name) => ({ name, enabled: !off.has(name) }))
}

// ---------------------------------------------------------------------------
// Detection models each AI pattern needs (mirrors the checks in importFieldSettings)

export function requiredModels(pattern: string, data: FieldSettings, aiGatherModel: unknown): string[] {
  if (pattern === ROBIN_AI_PATTERN) {
    const size = { Standard: "standard", Light: "small", Mini: "mini" }[robinAIModelName(aiGatherModel)] ?? "standard"
    return [`token_detection_${size}`, "sprinkler_detection_standard"]
  }
  if (pattern === BLOOMS_AI_PATTERN) {
    const v = String(data.blooms_ai_model ?? "standard").trim().toLowerCase()
    const size = ["standard", "light", "mini"].includes(v) ? v : "standard"
    return [`bloom_detection_${size}`, "sprinkler_detection_standard"]
  }
  return []
}

export type ModelInfo = { name: string; installed: boolean; size_bytes?: number }

export const modelStem = (name: string) => name.replace(/\.(mlmodelc|onnx)$/i, "")

export type PatternInfo = {
  value: string
  label: string
  aiBacked: boolean
  description: string
}

/** getPatterns() returns objects in the app and plain names from the dev server. */
export function normalizePatterns(raw: unknown): PatternInfo[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => {
    if (p && typeof p === "object") {
      const o = p as Record<string, unknown>
      const value = String(o.value ?? o.name ?? "")
      return {
        value,
        label: String(o.label ?? value),
        aiBacked: Boolean(o.ai_backed),
        description: String(o.description ?? ""),
      }
    }
    const value = String(p)
    const ai = value === ROBIN_AI_PATTERN || value === BLOOMS_AI_PATTERN
    return { value, label: value === ROBIN_AI_PATTERN ? "AI Gathering" : value === BLOOMS_AI_PATTERN ? "BloomsAI" : value, aiBacked: ai, description: "" }
  })
}
