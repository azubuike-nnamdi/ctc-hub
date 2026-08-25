/**
 * App-level copies of Prisma enums.
 * `@prisma/client` does not export these under bundler/browser resolution,
 * so client and shared code must import from here instead.
 */

export type Role =
  "SUPER_ADMIN" | "ADMIN" | "PASTOR" | "USHER" | "FOLLOW_UP" | "MEMBER"

export type Chapel = "ADULT" | "YOUTH" | "JUNIOR"

export type MemberStatus = "ACTIVE" | "INACTIVE"

export type Gender = "MALE" | "FEMALE"

export type FirstTimerStatus =
  "NEW" | "CONTACTED" | "VISITED" | "RETURNED" | "TREASURE_HUNT"

export type AgeRange = "BELOW_20" | "RANGE_20_29" | "RANGE_30_39" | "ABOVE_40"

export type MembershipInterest = "YES" | "NO" | "INDECISIVE"

export type HearAboutSource =
  | "FACEBOOK"
  | "FAMILY"
  | "FLYER"
  | "PREACHING"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "YOUTUBE"
  | "GOOGLE_SEARCH"
  | "WEBSITE"
  | "EMAIL_SMS"
  | "TV"
  | "RADIO"
  | "OTHER"

export type SoulStage =
  | "FIRST_TIMER"
  | "FOLLOW_UP"
  | "MIP_IN_PROGRESS"
  | "MIP_COMPLETED"
  | "SOD_IN_PROGRESS"
  | "SOD_COMPLETED"
  | "SOM_IN_PROGRESS"
  | "SOM_COMPLETED"
  | "SOL_IN_PROGRESS"
  | "SOL_COMPLETED"

export type EventStatus = "DRAFT" | "SCHEDULED" | "CANCELLED" | "COMPLETED"

export type FollowUpType = "CALL" | "VISIT" | "NOTE"

export type FirstTimerCreatedBy = "SELF" | "STAFF"

export type SoulWinEventType = "PERSONAL" | "GROWTHNET" | "WINSOME"

export type SupportTopic =
  "ACCOUNT_DELETED" | "SIGN_IN" | "PASSWORD" | "PROFILE" | "OTHER"

export const FIRST_TIMER_CREATED_BY = {
  SELF: "SELF",
  STAFF: "STAFF",
} as const satisfies Record<string, FirstTimerCreatedBy>

export const SOUL_STAGE = {
  FIRST_TIMER: "FIRST_TIMER",
  FOLLOW_UP: "FOLLOW_UP",
  MIP_IN_PROGRESS: "MIP_IN_PROGRESS",
  MIP_COMPLETED: "MIP_COMPLETED",
  SOD_IN_PROGRESS: "SOD_IN_PROGRESS",
  SOD_COMPLETED: "SOD_COMPLETED",
  SOM_IN_PROGRESS: "SOM_IN_PROGRESS",
  SOM_COMPLETED: "SOM_COMPLETED",
  SOL_IN_PROGRESS: "SOL_IN_PROGRESS",
  SOL_COMPLETED: "SOL_COMPLETED",
} as const satisfies Record<string, SoulStage>

export const SOUL_WIN_EVENT_TYPE = {
  PERSONAL: "PERSONAL",
  GROWTHNET: "GROWTHNET",
  WINSOME: "WINSOME",
} as const satisfies Record<string, SoulWinEventType>
