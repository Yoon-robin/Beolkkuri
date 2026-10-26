// Small building blocks shared by the planters and boost pages.
import { CheckIcon, ChevronsUpDownIcon, ZoomInIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

/** One settings row: title + helper text on the left, control on the right. */
export function Row({ id, title, desc, children, className }: { id?: string; title: ReactNode; desc?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-x-6 gap-y-3 py-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={id} className="text-sm leading-snug font-medium">
          {title}
        </Label>
        {desc && <p className="text-[0.8rem] leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      <div className="shrink-0 sm:max-w-[55%]">{children}</div>
    </div>
  )
}

/** Button that asks for confirmation before running a destructive action. */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  icon,
  variant = "secondary",
  size,
}: {
  label: ReactNode
  title: ReactNode
  description: ReactNode
  confirmLabel?: ReactNode
  onConfirm: () => void | Promise<void>
  icon?: ReactNode
  variant?: "secondary" | "outline" | "destructive"
  size?: "sm" | "default"
}) {
  const { t } = useI18n()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>{confirmLabel ?? t("common.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Remember which sub-tab was open, like the old UI did. Storage may be unavailable. */
export function usePersistedTab(key: string, fallback: string) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  })
  const set = (next: string) => {
    setValue(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      // ignore
    }
  }
  return [value, set] as const
}

export type PickerOption = {
  value: string
  label: string
  /** Large picture (planter / nectar icon path). */
  image?: string
  /** Emoji shown when there is no image. */
  emoji?: string
  /** Small icon in the corner (e.g. the nectar a field produces). */
  badge?: string
}

function OptionVisual({ option, size = "md" }: { option: PickerOption; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-5 text-base" : "size-9 text-2xl"
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center", box)}>
      {option.image ? (
        <img src={option.image} alt="" className="size-full object-contain" draggable={false} />
      ) : option.emoji ? (
        <span className="leading-none">{option.emoji}</span>
      ) : (
        <span className="size-full rounded-md border border-dashed border-muted-foreground/40" />
      )}
      {option.badge && size === "md" && (
        <img src={option.badge} alt="" className="absolute -right-1.5 -bottom-1 size-4 object-contain drop-shadow" draggable={false} />
      )}
    </span>
  )
}

/** Dropdown that shows its options as a grid of picture tiles. */
export function IconPicker({
  id,
  options,
  value,
  onChange,
  matches,
  className,
  columns = 4,
  placeholder,
}: {
  id?: string
  options: PickerOption[]
  value: unknown
  onChange: (value: string) => void
  /** Custom equality between the saved value and an option value. */
  matches?: (saved: unknown, option: string) => boolean
  className?: string
  columns?: number
  placeholder?: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const eq = matches ?? ((a: unknown, b: string) => String(a ?? "").toLowerCase() === b.toLowerCase())
  const current = options.find((o) => eq(value, o.value))
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" role="combobox" aria-expanded={open} className={cn("h-11 w-full min-w-40 justify-between gap-2 px-2.5 font-normal", className)}>
          <span className="flex min-w-0 items-center gap-2">
            {current ? <OptionVisual option={current} size="sm" /> : null}
            <span className="truncate">{current?.label ?? placeholder ?? t("common.none")}</span>
            {current?.badge && <img src={current.badge} alt="" className="size-4 shrink-0 object-contain" draggable={false} />}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[min(32rem,calc(100vw-2rem))] p-2" align="start">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 6.5rem))` }}>
          {options.map((o) => {
            const on = current?.value === o.value
            return (
              <button
                key={o.value}
                type="button"
                title={o.label}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-[0.7rem] leading-tight transition-colors hover:bg-accent",
                  on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-transparent",
                )}
              >
                <OptionVisual option={o} />
                <span className="line-clamp-2">{o.label}</span>
                {on && <CheckIcon className="absolute top-1 right-1 size-3 text-primary" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** A reference picture that opens larger when clicked. */
export function ZoomImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("group relative mx-auto block overflow-hidden rounded-lg border", className)}>
        <img src={src} alt={alt} className="h-auto w-full" draggable={false} />
        <span className="absolute right-2 bottom-2 rounded-md bg-background/80 p-1 opacity-70 transition-opacity group-hover:opacity-100">
          <ZoomInIcon className="size-4" />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto p-2 sm:max-w-4xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt} className="h-auto w-full rounded-md" />
        </DialogContent>
      </Dialog>
    </>
  )
}
