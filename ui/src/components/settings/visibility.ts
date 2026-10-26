// Settings that only make sense when another setting has a particular value.
// Pages can add their own rules through SectionOverrides.hidden.

type Getter = (id: string) => unknown

const lower = (v: unknown) => String(v ?? "").toLowerCase()

const RULES: Record<string, (get: Getter) => boolean> = {
  // Whirligig fallback only applies when returning to hive by walking
  use_whirlwig_fallback: (get) => lower(get("return")) === "walk",
  // Scheduled rejoin: "every N hours" vs "daily at a time"
  rejoin_every: (get) => (lower(get("rejoin_schedule_type")) || "hours") !== "daily",
  rejoin_at_time: (get) => lower(get("rejoin_schedule_type")) === "daily",
  rejoin_timezone: (get) => lower(get("rejoin_schedule_type")) === "daily",
}

export function isVisible(id: string, get: Getter) {
  const rule = RULES[id]
  return rule ? rule(get) : true
}
