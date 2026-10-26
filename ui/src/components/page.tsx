import type { ReactNode } from "react"

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
    <div className={cn("mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6", className)}>
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
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
    </div>
  )
}
