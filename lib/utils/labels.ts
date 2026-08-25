import type {
  AgeRange,
  Chapel,
  FirstTimerCreatedBy,
  FirstTimerStatus,
  FollowUpType,
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
  "MIP_IN_PROGRESS",
  "MIP_COMPLETED",
  "SOD_IN_PROGRESS",
  "SOD_COMPLETED",
  "SOM_IN_PROGRESS",
  "SOM_COMPLETED",
  "SOL_IN_PROGRESS",
  "SOL_COMPLETED",
]

export const SOUL_STAGE_LABELS: Record<SoulStage, string> = {
  FIRST_TIMER: "First Timer",
  FOLLOW_UP: "Follow Up",
  MIP_IN_PROGRESS: "MIP in progress",
  MIP_COMPLETED: "MIP completed",
  SOD_IN_PROGRESS: "SOD in progress",
  SOD_COMPLETED: "SOD completed",
  SOM_IN_PROGRESS: "SOM in progress",
  SOM_COMPLETED: "SOM completed",
  SOL_IN_PROGRESS: "SOL in progress",
  SOL_COMPLETED: "SOL completed",
}

export const JOURNEY_STEPS = [
  { id: "FIRST_TIMER", label: "First Timer", stages: ["FIRST_TIMER"] },
  { id: "FOLLOW_UP", label: "Follow Up", stages: ["FOLLOW_UP"] },
  {
    id: "MIP",
    label: "MIP",
    stages: ["MIP_IN_PROGRESS", "MIP_COMPLETED"],
  },
  {
    id: "SOD",
    label: "SOD",
    stages: ["SOD_IN_PROGRESS", "SOD_COMPLETED"],
  },
  {
    id: "SOM",
    label: "SOM",
    stages: ["SOM_IN_PROGRESS", "SOM_COMPLETED"],
  },
  {
    id: "SOL",
    label: "SOL",
    stages: ["SOL_IN_PROGRESS", "SOL_COMPLETED"],
  },
] as const

export function journeyStepIndex(stage: SoulStage) {
  return JOURNEY_STEPS.findIndex((step) =>
    (step.stages as readonly SoulStage[]).includes(stage)
  )
}

export function hasCompletedMip(stage: SoulStage | null | undefined) {
  if (!stage) {
    return false
  }
  return SOUL_STAGES.indexOf(stage) >= SOUL_STAGES.indexOf("MIP_COMPLETED")
}

export function hasCompletedSod(stage: SoulStage | null | undefined) {
  if (!stage) {
    return false
  }
  return SOUL_STAGES.indexOf(stage) >= SOUL_STAGES.indexOf("SOD_COMPLETED")
}

export const DEPARTMENT_SOD_MESSAGE =
  "A member can join a department after they complete SOD."

export function journeyStepState(
  stage: SoulStage,
  stepIndex: number
): "complete" | "current" | "upcoming" {
  const currentIndex = journeyStepIndex(stage)
  if (currentIndex < 0 || currentIndex < stepIndex) {
    return "upcoming"
  }
  if (currentIndex > stepIndex) {
    return "complete"
  }
  const step = JOURNEY_STEPS[stepIndex]
  const completedStage = step.stages[step.stages.length - 1]
  if (step.stages.length > 1 && stage === completedStage) {
    return "complete"
  }
  return "current"
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

export const FOLLOW_UP_TYPES: FollowUpType[] = ["CALL", "VISIT", "NOTE"]

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  CALL: "Call",
  VISIT: "Visit",
  NOTE: "Note",
}

export const FOLLOW_UP_ASSIGNEE_HINT =
  "Only members in Mission or Follow-up can be assigned to follow up."

export function soulProgress(stage: SoulStage) {
  const stepIndex = journeyStepIndex(stage)
  if (stepIndex < 0) {
    return 0
  }
  const step = JOURNEY_STEPS[stepIndex]
  const inProgress = step.stages.length > 1 && stage === step.stages[0]
  const units = inProgress ? stepIndex + 0.5 : stepIndex + 1
  return Math.round((units / JOURNEY_STEPS.length) * 100)
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
