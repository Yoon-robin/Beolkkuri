// Number formatting shared by the Tools calculators (same output as the old tab).

const UNITS = [
  { threshold: 1e18, suffix: "Qn" },
  { threshold: 1e15, suffix: "Qd" },
  { threshold: 1e12, suffix: "T" },
  { threshold: 1e9, suffix: "B" },
  { threshold: 1e6, suffix: "M" },
  { threshold: 1e3, suffix: "K" },
]

const compact = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** 1234567 -> "1.23 M" (game-style honey suffixes). */
export function formatCompactHoney(value: number) {
  const abs = Math.abs(value)
  for (const unit of UNITS) {
    if (abs >= unit.threshold) return `${compact.format(value / unit.threshold)} ${unit.suffix}`
  }
  return compact.format(value)
}

export const formatWholeNumber = (value: number) => Math.round(value).toLocaleString()

/** Honey unit multipliers offered next to price boxes. */
export const HONEY_UNITS = [
  { value: "1000", label: "K" },
  { value: "1000000", label: "M" },
  { value: "1000000000", label: "B" },
  { value: "1000000000000", label: "T" },
  { value: "1000000000000000", label: "Qd" },
  { value: "1000000000000000000", label: "Qn" },
] as const
