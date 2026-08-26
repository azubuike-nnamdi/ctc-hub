"use client"

import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { followUpDueState } from "@/lib/follow-up/due"

const styles: Record<string, string> = {
  overdue: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  "due-today":
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  upcoming: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  closed: "bg-muted text-muted-foreground",
}

export function FollowUpDueBadge({
  nextContactAt,
}: {
  nextContactAt: string | Date | null | undefined
}) {
  const state = followUpDueState(nextContactAt)
  const due = nextContactAt ? new Date(nextContactAt) : null
  const label =
    state === "closed" || !due
      ? "No follow-up due"
      : state === "overdue"
        ? `Overdue · ${format(due, "MMM d")}`
        : state === "due-today"
          ? `Due today · ${format(due, "h:mm a")}`
          : format(due, "MMM d")

  return (
    <Badge variant="secondary" className={styles[state]}>
      {label}
    </Badge>
  )
}
