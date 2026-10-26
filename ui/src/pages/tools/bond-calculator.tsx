import { CalculatorIcon, TriangleAlertIcon } from "lucide-react"
import { useMemo } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStrings, type PageStrings } from "@/i18n"

import { formatCompactHoney, formatWholeNumber } from "./calc-format"
import { NumberInput, Stat, useStickyState } from "./shared"

const TREAT_COST_HONEY = 10000
// Bond needed to go from level i to i + 1 (index = current level).
const BOND_REQUIREMENTS = [
  0, 10, 40, 200, 750, 4000, 15000, 60000, 270000, 450000, 1200000, 2000000, 4000000, 7000000, 15000000, 120000000,
  450000000, 1900000000, 7500000000, 15000000000, 475000000000, 4500000000000, 95000000000000, 900000000000000,
  9000000000000000,
]

const START_LEVELS = Array.from({ length: 24 }, (_, i) => String(i + 1)) // 1..24
const END_LEVELS = Array.from({ length: 24 }, (_, i) => String(i + 2)) // 2..25

function calculateTreatsForBond(bond: number, bonusPercent: number) {
  // 100% is the base (no bonus): the input is the total Bond from Treats %,
  // and only the part above 100 adds bond per treat.
  const effectiveBonus = Math.max(0, (Number(bonusPercent) || 0) - 100)
  const bondPerTreat = 10 * (1 + effectiveBonus / 100)
  return Math.ceil(bond / bondPerTreat)
}

function clampBonus(raw: string) {
  let n = parseFloat(raw)
  if (Number.isNaN(n) || n < 0) n = 0
  if (n > 300) n = 300
  return n
}

function clampBees(raw: string) {
  let n = parseInt(raw, 10)
  if (Number.isNaN(n) || n < 1) n = 1
  if (n > 50) n = 50
  return n
}

const strings: PageStrings<
  | "title"
  | "desc"
  | "hint"
  | "start"
  | "end"
  | "levelN"
  | "bonus"
  | "bonusHint"
  | "bees"
  | "beesHint"
  | "warning"
  | "totalBond"
  | "treatsFor"
  | "costOne"
  | "costFor"
  | "level"
  | "bondRequired"
  | "treatsNeeded"
  | "costPerBee"
  | "costForBees"
> = {
  ko: {
    title: "유대감 / 간식 계산기",
    desc: "벌 레벨을 올리는 데 필요한 간식 개수와 꿀 비용을 계산해요.",
    hint: "간식은 1개에 꿀 10,000개로 계산해요. 'Bond from Treats' 값은 게임 안의 능력치(Stats) 창에서 볼 수 있어요.",
    start: "지금 레벨",
    end: "목표 레벨",
    levelN: "{n}레벨",
    bonus: "간식 유대감 보너스 (%)",
    bonusHint: "능력치 창의 Bond from Treats 값을 그대로 넣으세요. (0~300)",
    bees: "벌 마리 수",
    beesHint: "레벨을 올릴 벌이 몇 마리인지 넣어요. (1~50)",
    warning: "목표 레벨은 지금 레벨보다 높아야 해요.",
    totalBond: "필요한 유대감 (1마리)",
    treatsFor: "필요한 간식 ({count}마리)",
    costOne: "꿀 비용 (1마리)",
    costFor: "꿀 비용 ({count}마리)",
    level: "레벨",
    bondRequired: "필요한 유대감",
    treatsNeeded: "필요한 간식",
    costPerBee: "1마리 비용",
    costForBees: "{count}마리 비용",
  },
  en: {
    title: "Bond / Treat Calculator",
    desc: "Treat count and honey cost between bond levels using your Bond from Treats stat.",
    hint: "Each treat costs 10,000 honey. You can find your Bond from Treats % in your character stats in BSS.",
    start: "Initial level",
    end: "Final level",
    levelN: "Level {n}",
    bonus: "Bond from Treats (%)",
    bonusHint: "Enter the value shown in your stats. (0–300)",
    bees: "# of bees",
    beesHint: "How many bees you're leveling. (1–50)",
    warning: "Final level must be higher than initial level.",
    totalBond: "Total bond",
    treatsFor: "Treats needed ({count} bees)",
    costOne: "Cost (1 bee)",
    costFor: "Cost ({count} bees)",
    level: "Level",
    bondRequired: "Bond required",
    treatsNeeded: "Treats needed",
    costPerBee: "Cost per bee",
    costForBees: "Cost for {count} bees",
  },
}

export function BondCalculator() {
  const t = useStrings(strings)
  const [startLevel, setStartLevel] = useStickyState("bond-calc-start-level", "1")
  const [endLevel, setEndLevel] = useStickyState("bond-calc-end-level", "25")
  const [bonusText, setBonusText] = useStickyState("bond-calc-bonus", "20")
  const [beesText, setBeesText] = useStickyState("bond-calc-bee-count", "50")

  const bonus = clampBonus(bonusText)
  const bees = clampBees(beesText)
  const from = parseInt(startLevel, 10)
  const to = parseInt(endLevel, 10)
  const invalid = from >= to

  const { rows, totals } = useMemo(() => {
    const rows: { label: string; bond: number; treats: number; costPerBee: number; costForBees: number }[] = []
    if (from >= to) return { rows, totals: { bond: 0, treats: 0, costOne: 0 } }
    for (let level = from; level < to; level++) {
      const bond = BOND_REQUIREMENTS[level] || 0
      const treats = calculateTreatsForBond(bond, bonus)
      const costPerBee = treats * TREAT_COST_HONEY
      rows.push({ label: `${level} → ${level + 1}`, bond, treats, costPerBee, costForBees: costPerBee * bees })
    }
    const totals = rows.reduce(
      (acc, r) => ({ bond: acc.bond + r.bond, treats: acc.treats + r.treats, costOne: acc.costOne + r.costPerBee }),
      { bond: 0, treats: 0, costOne: 0 },
    )
    return { rows, totals }
  }, [from, to, bonus, bees])

  const show = (n: number) => (invalid ? "0" : formatCompactHoney(n))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="size-5 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("hint")}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>{t("start")}</Label>
            <Select value={startLevel} onValueChange={setStartLevel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {START_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {t("levelN", { n: l })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("end")}</Label>
            <Select value={endLevel} onValueChange={setEndLevel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {END_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {t("levelN", { n: l })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bond-calc-bonus">{t("bonus")}</Label>
            <NumberInput
              id="bond-calc-bonus"
              value={bonusText}
              decimal
              className="w-full"
              onChange={setBonusText}
              onBlur={() => setBonusText(String(clampBonus(bonusText)))}
            />
            <p className="text-xs text-muted-foreground">{t("bonusHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bond-calc-bee-count">{t("bees")}</Label>
            <NumberInput
              id="bond-calc-bee-count"
              value={beesText}
              maxLength={2}
              className="w-full"
              onChange={setBeesText}
              onBlur={() => setBeesText(String(clampBees(beesText)))}
            />
            <p className="text-xs text-muted-foreground">{t("beesHint")}</p>
          </div>
        </div>

        {invalid && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{t("warning")}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={t("totalBond")} value={show(totals.bond)} />
          <Stat label={t("treatsFor", { count: bees })} value={show(totals.treats * bees)} />
          <Stat label={t("costOne")} value={show(totals.costOne)} />
          <Stat label={t("costFor", { count: bees })} value={show(totals.costOne * bees)} className="border-primary/40 bg-primary/5" />
        </div>

        {!invalid && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t("level")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("bondRequired")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("treatsNeeded")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("costPerBee")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("costForBees", { count: bees })}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map((r) => (
                  <tr key={r.label} className="border-t">
                    <td className="px-3 py-1.5 whitespace-nowrap">{r.label}</td>
                    <td className="px-3 py-1.5 text-right">{formatWholeNumber(r.bond)}</td>
                    <td className="px-3 py-1.5 text-right">{formatWholeNumber(r.treats)}</td>
                    <td className="px-3 py-1.5 text-right">{formatCompactHoney(r.costPerBee)}</td>
                    <td className="px-3 py-1.5 text-right">{formatCompactHoney(r.costForBees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
