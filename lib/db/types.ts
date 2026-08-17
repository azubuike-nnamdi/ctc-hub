import type {
  AgeRange,
  Chapel,
  EventStatus,
  FirstTimerCreatedBy,
  FirstTimerStatus,
  Gender,
  HearAboutSource,
  MemberStatus,
  MembershipInterest,
  SoulWinEventType,
} from "@/lib/db/enums"

export type {
  AgeRange,
  Chapel,
  EventStatus,
  FirstTimerCreatedBy,
  FirstTimerStatus,
  FollowUpType,
  Gender,
  HearAboutSource,
  MemberStatus,
  MembershipInterest,
  Role,
  SoulStage,
  SoulWinEventType,
  SupportTopic,
} from "@/lib/db/enums"

/** JSON-safe member shape returned by the members API. */
export type Member = {
  id: string
  memberCode: string
  branchId: string
  userId: string | null
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
  isDeleted: boolean
  deletedAt: string | null
  deletedById: string | null
  deletedBy?: { firstName: string; lastName: string } | null
  createdAt: string
  updatedAt: string
}

export type SoulWin = {
  id: string
  branchId: string
  memberId: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  eventType: SoulWinEventType
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
  occupation: string | null
  birthday: string | null
  ageRange: AgeRange | null
  membershipInterest: MembershipInterest | null
  hearAboutUs: HearAboutSource[]
  hearAboutOther: string | null
  invitedBy: string | null
  eventId: string | null
  prayerRequest: string | null
  registeredAt: string
  assignedToId: string | null
  createdBy: FirstTimerCreatedBy
  createdByUserId: string | null
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
