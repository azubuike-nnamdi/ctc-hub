import { z } from "zod"

import { CONSENT_VERSION } from "@/lib/cookies/consent"

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const optionalEmail = z
  .string()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""))

const optionalUrl = z
  .string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""))

export const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Enter a valid email address"),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  chapel: z.enum(["ADULT", "YOUTH", "JUNIOR"]),
  dateJoined: z.string().min(1, "Date joined is required"),
  photoUrl: optionalUrl,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

export const memberSignupSchema = memberSchema.extend({
  branchSlug: z.string().min(1, "Campus is required"),
})

export const memberSelfUpdateSchema = memberSchema.omit({
  dateJoined: true,
  status: true,
})

export const soulWinSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: optionalEmail,
  eventType: z.enum(["PERSONAL", "GROWTHNET", "WINSOME"], {
    error: "Select an event type",
  }),
})

const firstTimerVisitorFields = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: optionalEmail,
  occupation: z.string().optional().or(z.literal("")),
  birthday: z
    .union([
      z.literal(""),
      z.string().regex(/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/, "Use dd/mm"),
    ])
    .optional(),
  gender: z.enum(["MALE", "FEMALE"], {
    error: "Select a gender",
  }),
  ageRange: z.enum(["BELOW_20", "RANGE_20_29", "RANGE_30_39", "ABOVE_40"], {
    error: "Select an age range",
  }),
  membershipInterest: z.enum(["YES", "NO", "INDECISIVE"], {
    error: "Select an option",
  }),
  hearAboutUs: z
    .array(
      z.enum([
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
      ])
    )
    .min(1, "Select at least one option"),
  hearAboutOther: z.string().optional().or(z.literal("")),
  prayerRequest: z.string().optional().or(z.literal("")),
})

function withHearAboutOther<T extends z.ZodType>(schema: T) {
  return schema.refine(
    (data) => {
      const value = data as { hearAboutUs: string[]; hearAboutOther?: string }
      return (
        !value.hearAboutUs.includes("OTHER") ||
        Boolean(value.hearAboutOther?.trim())
      )
    },
    {
      message: "Specify how you heard about us",
      path: ["hearAboutOther"],
    }
  )
}

export const firstTimerVisitorSchema = withHearAboutOther(
  firstTimerVisitorFields
)

export const publicFirstTimerSchema = withHearAboutOther(
  firstTimerVisitorFields.extend({
    branchSlug: z.string().min(1, "Campus is required"),
  })
)

export const firstTimerSchema = withHearAboutOther(
  firstTimerVisitorFields.extend({
    address: z.string().optional().or(z.literal("")),
    invitedBy: z.string().optional().or(z.literal("")),
    eventId: z.string().optional().or(z.literal("")),
    assignedToId: z.string().optional().or(z.literal("")),
    status: z
      .enum(["NEW", "CONTACTED", "VISITED", "RETURNED", "TREASURE_HUNT"])
      .optional(),
  })
)

export const firstTimerStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "VISITED", "RETURNED", "TREASURE_HUNT"]),
  assignedToId: z.string().optional().nullable(),
})

export const followUpNoteSchema = z.object({
  type: z.enum(["CALL", "VISIT", "NOTE"]).default("NOTE"),
  note: z.string().min(1, "Note is required"),
})

export const soulTrackerUpdateSchema = z.object({
  currentStage: z
    .enum([
      "FIRST_TIMER",
      "FOLLOW_UP",
      "TREASURE_HUNT",
      "MISSION_IGNITION",
      "WORKER_TRAINING",
      "WORKER",
      "LEADER",
    ])
    .optional(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
})

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional().or(z.literal("")),
    startsAt: z.string().min(1, "Start time is required"),
    endsAt: z.string().min(1, "End time is required"),
    venue: z.string().min(1, "Venue is required"),
    status: z.enum(["DRAFT", "SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
    capacity: z.number().int().positive().optional().nullable(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End time must be after start time",
    path: ["endsAt"],
  })

export const userCreateSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    role: z.enum(["ADMIN", "PASTOR", "USHER", "FOLLOW_UP", "SUPER_ADMIN"]),
    branchId: z.string().optional().nullable(),
  })
  .refine((data) => data.role === "SUPER_ADMIN" || Boolean(data.branchId), {
    message: "Select a branch for this role",
    path: ["branchId"],
  })

export const passwordResetSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Choose a different password from the temporary one",
    path: ["newPassword"],
  })

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
})

export const paginationSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

export const supportRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional().or(z.literal("")),
  topic: z.enum(
    ["ACCOUNT_DELETED", "SIGN_IN", "PASSWORD", "PROFILE", "OTHER"],
    { error: "Select the support you need" }
  ),
  message: z.string().min(10, "Tell us a little more so we can help"),
})

export const cookieConsentSchema = z.object({
  version: z.literal(CONSENT_VERSION, {
    error: "Refresh the page and accept again",
  }),
})
