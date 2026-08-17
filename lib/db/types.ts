import type {
  Chapel,
  EventStatus,
  FirstTimerStatus,
  Gender,
  MemberStatus,
} from "@/lib/db/enums"

export type {
  Chapel,
  EventStatus,
  FirstTimerStatus,
  FollowUpType,
  Gender,
  MemberStatus,
  Role,
  SoulStage,
} from "@/lib/db/enums"

/** JSON-safe member shape returned by the members API. */
export type Member = {
  id: string
  memberCode: string
  branchId: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  gender: Gender
  dateOfBirth: string | null
  address: string | null
  chapel: Chapel
  dateJoined: string
  status: MemberStatus
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

/** JSON-safe first-timer shape returned by the first-timers API. */
export type FirstTimer = {
  id: string
  branchId: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  address: string | null
  gender: Gender
  invitedBy: string | null
  eventId: string | null
  prayerRequest: string | null
  registeredAt: string
  assignedToId: string | null
  status: FirstTimerStatus
  createdAt: string
  updatedAt: string
}

/** JSON-safe event shape returned by the events API. */
export type Event = {
  id: string
  branchId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  venue: string
  status: EventStatus
  capacity: number | null
  createdById: string
  createdAt: string
  updatedAt: string
}
