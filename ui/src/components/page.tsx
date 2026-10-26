import { CloudOffIcon, Loader2Icon, RotateCwIcon, type LucideIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

/** Standard page frame: title row + content column. */
export function Page({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rm-page mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

/** Shown while settings are loading for the first time. */
export function PageLoading() {
  const { t } = useI18n()
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6" role="status" aria-label={t("common.loading")}>
      <div className="space-y-2">
        <div className="rm-shimmer h-8 w-48 rounded-md" />
        <div className="rm-shimmer h-4 w-72 max-w-full rounded-md" />
      </div>
      <div className="rm-shimmer h-40 rounded-xl" />
      <div className="rm-shimmer h-64 rounded-xl" />
    </div>
  )
}

/** Shown instead of a page when the first settings load failed. */
export function PageError({ onRetry }: { onRetry: () => Promise<void> }) {
  const { t } = useI18n()
  const [retrying, setRetrying] = useState(false)
  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <EmptyState
        icon={CloudOffIcon}
        title={t("load.failedTitle")}
        description={t("load.failedDesc")}
        className="animate-in fade-in-0 py-16 duration-300"
        action={
          <Button
            onClick={async () => {
              setRetrying(true)
              try {
                await onRetry()
              } finally {
                setRetrying(false)
              }
            }}
            disabled={retrying}
          >
            {retrying ? <Loader2Icon className="animate-spin" /> : <RotateCwIcon />}
            {t("common.retry")}
          </Button>
        }
      />
    </div>
  )
}

/** "Nothing here yet" block: an icon, a short line, and optionally the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center", className)}>
      {Icon && (
        <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      )}
      {title && <p className="text-sm font-medium">{title}</p>}
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
