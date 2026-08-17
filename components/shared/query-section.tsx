"use client"

import { Loader2Icon } from "lucide-react"
import type { ReactNode } from "react"

import { ErrorState } from "@/components/shared/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function QuerySection({
  isPending,
  isError,
  isFetching,
  error,
  onRetry,
  skeleton,
  hasData,
  children,
}: {
  isPending: boolean
  isError: boolean
  isFetching?: boolean
  error?: Error | null
  onRetry?: () => void
  skeleton?: ReactNode
  hasData?: boolean
  children: ReactNode
}) {
  if (isError && !hasData) {
    return (
      <ErrorState
        description={error?.message}
        onRetry={onRetry}
        isRetrying={isFetching}
      />
    )
  }

  if (isPending) {
    return skeleton ?? <SectionSpinner />
  }

  return (
    <div className="grid gap-2">
      {isError ? (
        <ErrorState
          compact
          title="Could not refresh this data."
          description={error?.message}
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : isFetching ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2Icon className="size-3 animate-spin" />
          Updating...
        </p>
      ) : null}
      {children}
    </div>
  )
}

export function SectionSpinner({
  label = "Loading...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border py-12 text-sm text-muted-foreground",
        className
      )}
    >
      <Loader2Icon className="size-4 animate-spin" />
      {label}
    </div>
  )
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-3">
            {Array.from({ length: columns }).map((__, column) => (
              <Skeleton key={column} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-xl" />
      ))}
    </div>
  )
}
