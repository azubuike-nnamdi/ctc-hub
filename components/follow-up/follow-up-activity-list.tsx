import { format } from "date-fns"
import { NotebookPenIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"

export type FollowUpActivityItem = {
  id: string
  type: string
  note: string
  contactedAt?: string
  wouldWorshipAgain?: boolean | null
  createdAt: string
  createdBy: { firstName: string; lastName: string }
}

export function FollowUpActivityList({
  activities,
}: {
  activities: FollowUpActivityItem[]
}) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No follow-up activities yet"
        description="Calls, visits, and notes logged here will appear in this history."
        icon={NotebookPenIcon}
        className="border-0 py-6"
      />
    )
  }

  return (
    <div className="grid gap-4">
      {activities.map((activity) => (
        <div key={activity.id} className="border-b pb-3 last:border-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={activity.type} />
            {activity.wouldWorshipAgain === true ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Would worship again
              </p>
            ) : null}
            {activity.wouldWorshipAgain === false ? (
              <p className="text-xs text-muted-foreground">
                Would not worship again
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{activity.note}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activity.createdBy.firstName} {activity.createdBy.lastName} ·{" "}
            {format(
              new Date(activity.contactedAt ?? activity.createdAt),
              "MMM d, yyyy, HH:mm"
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
