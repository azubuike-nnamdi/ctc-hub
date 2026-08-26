import { format } from "date-fns"
import { UserPlusIcon } from "lucide-react"

import type { FirstTimerListItem } from "@/components/first-timers/types"
import { FollowUpDueBadge } from "@/components/follow-up/follow-up-due-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function FirstTimerTable({
  items,
  canFollowUp,
  onFollowUp,
}: {
  items: FirstTimerListItem[]
  canFollowUp: boolean
  onFollowUp: (item: FirstTimerListItem) => void
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="No first timers yet"
        description="Register a visitor after Sunday service to start follow-up."
        icon={UserPlusIcon}
      />
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Visitor</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Date visited</TableHead>
            <TableHead>Registered by</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.firstName} {item.lastName}
              </TableCell>
              <TableCell>{item.phone}</TableCell>
              <TableCell>
                <StatusBadge value={item.gender} />
              </TableCell>
              <TableCell>
                {format(new Date(item.registeredAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {item.createdBy === "SELF" ? (
                  <StatusBadge value="SELF" />
                ) : item.createdByUser ? (
                  `${item.createdByUser.firstName} ${item.createdByUser.lastName}`
                ) : (
                  "Staff"
                )}
              </TableCell>
              <TableCell>
                <StatusBadge value={item.status} />
              </TableCell>
              <TableCell>
                <FollowUpDueBadge nextContactAt={item.nextContactAt} />
              </TableCell>
              <TableCell>
                {item.assignedTo
                  ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
                  : "Unassigned"}
              </TableCell>
              <TableCell className="text-right">
                {canFollowUp ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFollowUp(item)}
                  >
                    Follow up
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
