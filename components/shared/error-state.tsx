"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ErrorState({
  title = "Something went wrong.",
  description,
  onRetry,
  isRetrying,
  retryLabel = "Try again",
  compact,
  className,
  children,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  isRetrying?: boolean
  retryLabel?: string
  compact?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      role="alert"
      className={cn(
        "w-full rounded-xl border border-destructive/20 bg-destructive/5",
        compact
          ? "flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          : "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      <div className={cn("grid gap-1", compact ? "text-left" : "max-w-sm")}>
        <p className="text-sm font-medium text-destructive">{title}</p>
        {description && description !== title ? (
          <p className="text-sm text-destructive/80">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          isLoadingText="Retrying..."
        >
          {retryLabel}
        </Button>
      ) : null}
      {children}
    </div>
  )
}
