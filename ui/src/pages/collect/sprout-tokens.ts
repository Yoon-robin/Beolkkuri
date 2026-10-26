// Token lists the sprout AI models can detect (copied from the old gather/collect
// scripts so saved values stay identical).

const STANDARD_TOKENS = [
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
  "Falling Star", "Festive Blessing Token", "Festive Gift Token", "Festive Mark Station", "Festive Mark Token",
  "Fetch", "Flame Fuel", "Focus", "Fully Collected Target", "Fuzz Bombs Token", "Glitch Token", "Glob",
  "Gumdrop Barrage", "Haste", "Honey Mark Station", "Honey Mark Token", "Honey Token", "Impale",
  "Inferno Token", "Inflate Balloons", "Inspire Token", "Jelly Bean", "Map Corruption", "Mark Surge Token",
  "Melody", "Mind Hack", "Mother Bear Morph", "Panda Bear Morph", "Pineapple", "Polar Bear Morph",
  "Pollen Haze", "Pollen Mark Station", "Pollen Mark Token", "Precise Mark Station", "Precise Mark Target",
  "Pulse", "Puppy Love", "Rage Token", "Rain Cloud", "Red Bomb Sync", "Red Boost", "Science Bear Morph",
  "Scratch", "Smiley", "Snowflake", "Snowglobe Shake", "Strawberry", "Summon Frog Token", "Sunflower Seed",
  "Surprise Party", "Tabby Love", "Target Practice Token", "TennisBall", "Token Link", "Tornado", "Treat",
  "Triangulate Token", "Unactivated Target", "White Boost",
]

export const SPROUT_TOKENS_BY_MODEL: Record<"Standard" | "Light" | "Mini", string[]> = {
  Standard: STANDARD_TOKENS,
  Light: [
    "Baby Love", "Bear Morph", "Bomb", "Boost", "Festive Gift Token",
    "Focus", "Summon Frog Token", "Fuzz Bombs Token", "Haste", "Honey Token",
    "Inflate Balloons", "Inspire Token", "Loot", "Mark", "Melody",
    "Party Balloons", "Tabby Love", "Token Link",
  ],
  Mini: [
    "Balloon", "Bear Morph", "Bomb", "Boost", "Summon Frog Token", "Haste",
    "Inspire Token", "Long Buff", "Loot", "Mark", "Token Link",
  ],
}

/** Tokens the "Field Drops" preset moves to the top, per sprout field. */
export const SPROUT_FIELD_TOKENS: Record<string, string[]> = {
  sunflower: ["Sunflower Seed"],
  pineapple: ["Pineapple"],
  strawberry: ["Strawberry"],
  coconut: ["Coconut"],
  "blue flower": ["Blueberry"],
  bamboo: ["Blueberry"],
  "pine tree": ["Blueberry"],
  stump: ["Blueberry"],
  mushroom: ["Strawberry"],
  rose: ["Strawberry"],
  pepper: ["Strawberry"],
}

export const normalizeSproutModel = (value: unknown) =>
  String(value || "standard").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")

/** Loot models chase loot drops, so the token priority list does not apply. */
export const isLootSproutModel = (value: unknown) =>
  ["loot_light", "loot_mini", "light", "mini"].includes(normalizeSproutModel(value))

export function sproutTokenModelName(value: unknown): keyof typeof SPROUT_TOKENS_BY_MODEL {
  const model = normalizeSproutModel(value)
  if (model === "token_light" || model === "loot_light" || model === "light") return "Light"
  if (model === "token_mini" || model === "loot_mini" || model === "mini") return "Mini"
  return "Standard"
}

export const isHiddenSproutToken = (token: string) => token === "Bloom" || token.startsWith("Duped ")

export function parseTokenList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((t) => String(t).trim()).filter(Boolean)
  if (!value) return []
  return String(value)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

export type TokenRow = { name: string; enabled: boolean }

/** Ordered rows: preferred tokens first (in saved order), then the rest of the model's list. */
export function buildTokenRows(allTokens: string[], preferredValue: unknown, ignoredValue: unknown): TokenRow[] {
  const names = allTokens.filter((t) => !isHiddenSproutToken(t))
  const preferred = parseTokenList(preferredValue)
  const ignored = new Set(parseTokenList(ignoredValue))
  const ordered: string[] = []
  for (const t of preferred) if (names.includes(t) && !ordered.includes(t)) ordered.push(t)
  for (const t of names) if (!ordered.includes(t)) ordered.push(t)
  return ordered.map((name) => ({ name, enabled: !ignored.has(name) }))
}

/** Same result as the old "Field Drops" / "All Sprout Drops" / "Clear" preset buttons. */
export function presetTokenRows(allTokens: string[], preset: "field" | "all" | "clear", field: string): TokenRow[] {
  const names = allTokens.filter((t) => !isHiddenSproutToken(t))
  let preferred: string[] = []
  if (preset === "all") preferred = names
  else if (preset === "field") {
    const fieldTokens = SPROUT_FIELD_TOKENS[field] ?? []
    preferred = [...fieldTokens, ...names].filter((t, i, arr) => names.includes(t) && arr.indexOf(t) === i)
  }
  preferred = preferred.filter((t, i, arr) => arr.indexOf(t) === i)
  const ignored = allTokens.filter((t) => isHiddenSproutToken(t) || !preferred.includes(t))
  return buildTokenRows(allTokens, preferred, ignored)
}

/** Values to save: enabled tokens in order, and everything else (hidden tokens first). */
export function tokenRowsToSettings(allTokens: string[], rows: TokenRow[]) {
  const preferred: string[] = []
  const ignored = allTokens.filter(isHiddenSproutToken)
  for (const row of rows) {
    if (row.enabled) preferred.push(row.name)
    else if (!ignored.includes(row.name)) ignored.push(row.name)
  }
  return { preferred: preferred.join(","), ignored: ignored.join(",") }
}
