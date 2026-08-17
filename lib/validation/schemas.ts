import { z } from "zod"

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
  email: optionalEmail,
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  chapel: z.enum(["ADULT", "YOUTH", "JUNIOR"]),
  dateJoined: z.string().min(1, "Date joined is required"),
  photoUrl: optionalUrl,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

export const firstTimerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Phone is required"),
  email: optionalEmail,
  address: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE"]),
  invitedBy: z.string().optional().or(z.literal("")),
  eventId: z.string().optional().or(z.literal("")),
  prayerRequest: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
  status: z
    .enum(["NEW", "CONTACTED", "VISITED", "RETURNED", "TREASURE_HUNT"])
    .optional(),
})

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
