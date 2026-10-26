import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

/** A settings row for custom controls, laid out like the generated schema rows. */
export function CustomRow({
  htmlFor,
  title,
  desc,
  children,
  stacked,
}: {
  htmlFor?: string
  title: ReactNode
  desc?: ReactNode
  children: ReactNode
  stacked?: boolean
}) {
  return (
    <div className={cn("flex gap-x-6 gap-y-3 py-3", stacked ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between")}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={htmlFor} className="text-sm leading-snug font-medium">
          {title}
        </Label>
        {desc && <p className="text-[0.8rem] leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      <div className={cn("shrink-0", !stacked && "sm:max-w-[55%]")}>{children}</div>
    </div>
  )
}

/** Controlled yes/no dialog for destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
}) {
  const { t } = useI18n()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel ?? t("common.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Save a blob through a temporary download link (works in the app's Chrome window). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function base64ToBlob(b64: string, type: string) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}
