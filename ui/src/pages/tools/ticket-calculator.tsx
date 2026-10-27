import { InfoIcon, TicketIcon } from "lucide-react"
import { useMemo } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStrings, type PageStrings } from "@/i18n"
import { cn } from "@/lib/utils"

import { HONEY_UNITS, formatCompactHoney, formatWholeNumber } from "./calc-format"
import { NumberInput, useStickyState } from "./shared"

const DEFAULT_NEXT_PRICE = 100000
const MAX_TICKETS = 100000
const PRESETS = [10, 100, 500]

/** Prices are whole thousands and never below 100K. */
function normalizeTicketPrice(value: string, unit: string) {
  const multiplier = Number(unit) || 1
  let price = Math.round(((Number(value) || 0) * multiplier) / 1000) * 1000
  if (price < DEFAULT_NEXT_PRICE) price = DEFAULT_NEXT_PRICE
  return price
}

function ticketsBoughtFromNextPrice(nextPrice: number) {
  if (nextPrice === DEFAULT_NEXT_PRICE) return 0
  if (nextPrice < 102000) return 1
  const scaled = nextPrice / 1000 - 100
  const inverseExponent = nextPrice <= 1824000 ? 5 / 6 : 10 / 17
  return Math.floor(Math.pow(scaled, inverseExponent)) + 1
}

function priceAfterBought(ticketsBought: number) {
  if (ticketsBought <= 0) return DEFAULT_NEXT_PRICE
  if (ticketsBought === 1) return 101000
  const exponent = ticketsBought < 499 ? 6 / 5 : 17 / 10
  return Math.ceil(Math.pow(ticketsBought, exponent) + 99) * 1000
}

function purchaseCost(nextPrice: number, count: number) {
  const toBuy = Math.max(0, Math.min(MAX_TICKETS, Math.floor(Number(count) || 0)))
  const already = ticketsBoughtFromNextPrice(nextPrice)
  let total = 0
  for (let i = 0; i < toBuy; i += 1) total += i === 0 ? nextPrice : priceAfterBought(already + i)
  return total
}

function ticketsForBudget(nextPrice: number, budget: number) {
  const already = ticketsBoughtFromNextPrice(nextPrice)
  const honey = Math.max(0, Number(budget) || 0)
  let total = 0
  let tickets = 0
  while (tickets < MAX_TICKETS) {
    const price = tickets === 0 ? nextPrice : priceAfterBought(already + tickets)
    if (total + price > honey) break
    total += price
    tickets += 1
  }
  return { tickets, total }
}

function clampCustom(raw: string) {
  let n = Math.floor(Number(raw) || 1)
  if (n < 1) n = 1
  if (n > MAX_TICKETS) n = MAX_TICKETS
  return n
}

const strings: PageStrings<
  | "title"
  | "desc"
  | "hint"
  | "nextPrice"
  | "nextPriceHint"
  | "custom"
  | "customHint"
  | "budget"
  | "budgetHint"
  | "rounded"
  | "tickets"
  | "cost"
  | "nTickets"
  | "customRow"
  | "maxRow"
> = {
  ko: {
    title: "티켓 가격 계산기",
    desc: "티켓 상점에서 티켓을 살 때 꿀이 얼마나 드는지 계산해요.",
    hint: "티켓은 살수록 값이 올라가요. 다음 티켓 가격을 넣으면 여러 장 살 때 드는 꿀을 알려 줘요.",
    nextPrice: "다음 티켓 가격",
    nextPriceHint: "상점에 지금 표시된 가격을 넣어요.",
    custom: "원하는 개수",
    customHint: "표에 따로 보고 싶은 티켓 수예요. (1~100,000)",
    budget: "가진 꿀 (예산)",
    budgetHint: "이 꿀로 최대 몇 장 살 수 있는지 알려 줘요.",
    rounded: "티켓 가격은 100K보다 낮을 수 없고, 1,000 단위로 반올림해서 계산해요.",
    tickets: "티켓",
    cost: "꿀 비용",
    nTickets: "{count}장",
    customRow: "{count}장 (직접 입력)",
    maxRow: "예산으로 최대 {count}장",
  },
  en: {
    title: "Ticket Price Calculator",
    desc: "Honey cost of buying tickets from the Bee Swarm Simulator ticket shop.",
    hint: "Tickets get pricier as you buy them. Enter your next ticket's price to see the cost of common bundles.",
    nextPrice: "Price of next ticket",
    nextPriceHint: "The price the shop shows right now.",
    custom: "Custom amount",
    customHint: "An extra ticket count to show in the table. (1–100,000)",
    budget: "Budget",
    budgetHint: "Shows the most tickets this much honey buys.",
    rounded: "Ticket prices below 100K are raised to 100K, and prices are rounded to the nearest 1,000 honey.",
    tickets: "Tickets",
    cost: "Cost",
    nTickets: "{count} tickets",
    customRow: "{count} tickets (custom)",
    maxRow: "Max ({count} tickets)",
  },
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HONEY_UNITS.map((u) => (
          <SelectItem key={u.value} value={u.value}>
            {u.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function TicketCalculator() {
  const t = useStrings(strings)
  const [priceText, setPriceText] = useStickyState("ticket-calc-next-price", "100")
  const [priceUnit, setPriceUnit] = useStickyState("ticket-calc-next-price-unit", "1000000")
  const [customText, setCustomText] = useStickyState("ticket-calc-custom-amount", "1")
  const [budgetText, setBudgetText] = useStickyState("ticket-calc-budget", "0")
  const [budgetUnit, setBudgetUnit] = useStickyState("ticket-calc-budget-unit", "1000000")

  const nextPrice = normalizeTicketPrice(priceText, priceUnit)
  const rawWhole = Number(priceText) * (Number(priceUnit) || 1)
  const rounded = Number.isFinite(rawWhole) && rawWhole > 0 && rawWhole !== nextPrice
  const budget = Math.max(0, (Number(budgetText) || 0) * (Number(budgetUnit) || 1))
  const custom = clampCustom(customText)

  const rows = useMemo(() => {
    const amounts = [...PRESETS, custom].filter((a, i, all) => all.indexOf(a) === i)
    return amounts.map((amount) => ({
      amount,
      isCustom: amount === custom && !PRESETS.includes(amount),
      cost: purchaseCost(nextPrice, amount),
    }))
  }, [nextPrice, custom])
  const max = useMemo(() => ticketsForBudget(nextPrice, budget), [nextPrice, budget])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="size-5 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("hint")}</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-calc-next-price">{t("nextPrice")}</Label>
            <div className="flex gap-2">
              <NumberInput id="ticket-calc-next-price" value={priceText} decimal className="w-full min-w-0" onChange={setPriceText} />
              <UnitSelect value={priceUnit} onChange={setPriceUnit} />
            </div>
            <p className="text-xs text-muted-foreground">{t("nextPriceHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-calc-custom-amount">{t("custom")}</Label>
            <NumberInput
              id="ticket-calc-custom-amount"
              value={customText}
              maxLength={6}
              className="w-full"
              onChange={setCustomText}
              onBlur={() => setCustomText(String(clampCustom(customText)))}
            />
            <p className="text-xs text-muted-foreground">{t("customHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-calc-budget">{t("budget")}</Label>
            <div className="flex gap-2">
              <NumberInput id="ticket-calc-budget" value={budgetText} decimal className="w-full min-w-0" onChange={setBudgetText} />
              <UnitSelect value={budgetUnit} onChange={setBudgetUnit} />
            </div>
            <p className="text-xs text-muted-foreground">{t("budgetHint")}</p>
          </div>
        </div>

        {rounded && (
          <Alert>
            <InfoIcon />
            <AlertDescription>{t("rounded")}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-lg border sm:max-w-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t("tickets")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("cost")}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.amount} className={cn("border-t", r.isCustom && "bg-muted/30")}>
                  <td className="px-3 py-1.5">
                    {t(r.isCustom ? "customRow" : "nTickets", { count: formatWholeNumber(r.amount) })}
                  </td>
                  <td className="px-3 py-1.5 text-right">{formatCompactHoney(r.cost)}</td>
                </tr>
              ))}
              <tr className="border-t bg-primary/5 font-medium">
                <td className="px-3 py-1.5">{t("maxRow", { count: formatWholeNumber(max.tickets) })}</td>
                <td className="px-3 py-1.5 text-right">{formatCompactHoney(max.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
