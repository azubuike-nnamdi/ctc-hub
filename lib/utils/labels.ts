import type {
  AgeRange,
  Chapel,
  FirstTimerCreatedBy,
  FirstTimerStatus,
  Gender,
  HearAboutSource,
  MembershipInterest,
  SoulStage,
  SoulWinEventType,
  SupportTopic,
} from "@/lib/db/enums"

export const SOUL_STAGES: SoulStage[] = [
  "FIRST_TIMER",
  "FOLLOW_UP",
  "TREASURE_HUNT",
  "MISSION_IGNITION",
  "WORKER_TRAINING",
  "WORKER",
  "LEADER",
]

export const SOUL_STAGE_LABELS: Record<SoulStage, string> = {
  FIRST_TIMER: "First Timer",
  FOLLOW_UP: "Follow-up",
  TREASURE_HUNT: "Treasure Hunt",
  MISSION_IGNITION: "Mission Ignition",
  WORKER_TRAINING: "Worker Training",
  WORKER: "Worker",
  LEADER: "Leader",
}

export const CHAPELS: Chapel[] = ["ADULT", "YOUTH", "JUNIOR"]

export const CHAPEL_LABELS: Record<Chapel, string> = {
  ADULT: "Adult",
  YOUTH: "Youth",
  JUNIOR: "Junior",
}

export const FIRST_TIMER_STATUSES: FirstTimerStatus[] = [
  "NEW",
  "CONTACTED",
  "VISITED",
  "RETURNED",
  "TREASURE_HUNT",
]

export const FIRST_TIMER_STATUS_LABELS: Record<FirstTimerStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  VISITED: "Visited",
  RETURNED: "Returned",
  TREASURE_HUNT: "Treasure Hunt",
}

export const GENDERS: Gender[] = ["MALE", "FEMALE"]

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
}

export const AGE_RANGES: AgeRange[] = [
  "BELOW_20",
  "RANGE_20_29",
  "RANGE_30_39",
  "ABOVE_40",
]

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  BELOW_20: "Below 20",
  RANGE_20_29: "20 - 29",
  RANGE_30_39: "30 - 39",
  ABOVE_40: "Above 40",
}

export const MEMBERSHIP_INTERESTS: MembershipInterest[] = [
  "YES",
  "NO",
  "INDECISIVE",
]

export const MEMBERSHIP_INTEREST_LABELS: Record<MembershipInterest, string> = {
  YES: "Yes",
  NO: "No",
  INDECISIVE: "Indecisive",
}

export const HEAR_ABOUT_SOURCES: HearAboutSource[] = [
  "FACEBOOK",
  "FAMILY",
  "FLYER",
  "PREACHING",
  "WHATSAPP",
  "INSTAGRAM",
  "YOUTUBE",
  "GOOGLE_SEARCH",
  "WEBSITE",
  "EMAIL_SMS",
  "TV",
  "RADIO",
  "OTHER",
]

export const HEAR_ABOUT_LABELS: Record<HearAboutSource, string> = {
  FACEBOOK: "Facebook",
  FAMILY: "Family",
  FLYER: "Flyer",
  PREACHING: "Preaching",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  GOOGLE_SEARCH: "Google Search",
  WEBSITE: "Website",
  EMAIL_SMS: "Email/SMS",
  TV: "TV",
  RADIO: "Radio",
  OTHER: "Others (Specify)",
}

export const FIRST_TIMER_CREATED_BY_LABELS: Record<
  FirstTimerCreatedBy,
  string
> = {
  SELF: "Self",
  STAFF: "Staff",
}

export function soulProgress(stage: SoulStage) {
  const index = SOUL_STAGES.indexOf(stage)
  return Math.round(((index + 1) / SOUL_STAGES.length) * 100)
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
}

export const SOUL_WIN_EVENT_TYPES: SoulWinEventType[] = [
  "PERSONAL",
  "GROWTHNET",
  "WINSOME",
]

export const SOUL_WIN_EVENT_LABELS: Record<SoulWinEventType, string> = {
  PERSONAL: "Personal",
  GROWTHNET: "GrowthNet",
  WINSOME: "Winsome",
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  "ACCOUNT_DELETED",
  "SIGN_IN",
  "PASSWORD",
  "PROFILE",
  "OTHER",
]

export const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  ACCOUNT_DELETED: "My account was deleted",
  SIGN_IN: "I cannot sign in",
  PASSWORD: "Password or reset help",
  PROFILE: "Update my member details",
  OTHER: "Something else",
}

export const SUPPORT_TOPIC_HELP: Record<SupportTopic, string> = {
  ACCOUNT_DELETED:
    "Ask the church office to restore access to a deleted member account.",
  SIGN_IN: "Get help if sign-in fails or you are locked out.",
  PASSWORD: "Request help resetting or changing your password.",
  PROFILE: "Ask staff to correct your name, phone, chapel, or other details.",
  OTHER: "Tell us what you need and we will point you to the right team.",
}
