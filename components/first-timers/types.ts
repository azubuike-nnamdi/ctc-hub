import type { FirstTimer } from "@/lib/db/types"

export type FirstTimerListItem = FirstTimer & {
  assignedTo: { id?: string; firstName: string; lastName: string } | null
  createdByUser: { firstName: string; lastName: string } | null
  nextContactAt: string | null
}

export type FirstTimerListResponse = {
  items: FirstTimerListItem[]
  total: number
}

export type FirstTimerStatsResponse = {
  total: number
  new: number
  overdue: number
  unassigned: number
  thisMonth: number
  becameMembers: number
}

export type FollowUpOptionsResponse = {
  followUpUsers: Array<{
    id: string
    firstName: string
    lastName: string
    departments?: string[]
  }>
}
