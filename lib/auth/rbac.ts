import type { Role } from "@/lib/db/enums"

export type { Role }

export type Action =
  | "members:read"
  | "members:write"
  | "first-timers:read"
  | "first-timers:create"
  | "first-timers:follow-up"
  | "soul-tracker:read"
  | "soul-tracker:write"
  | "events:read"
  | "events:write"
  | "users:read"
  | "users:write"
  | "settings:profile"

const ALL: Action[] = [
  "members:read",
  "members:write",
  "first-timers:read",
  "first-timers:create",
  "first-timers:follow-up",
  "soul-tracker:read",
  "soul-tracker:write",
  "events:read",
  "events:write",
  "users:read",
  "users:write",
  "settings:profile",
]

const permissions: Record<Role, Action[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((action) => action !== "users:write"),
  PASTOR: [
    "members:read",
    "first-timers:read",
    "soul-tracker:read",
    "events:read",
    "settings:profile",
  ],
  USHER: [
    "members:read",
    "members:write",
    "first-timers:read",
    "first-timers:create",
    "soul-tracker:read",
    "events:read",
    "settings:profile",
  ],
  FOLLOW_UP: [
    "members:read",
    "first-timers:read",
    "first-timers:follow-up",
    "soul-tracker:read",
    "soul-tracker:write",
    "events:read",
    "settings:profile",
  ],
}

export function can(role: Role, action: Action) {
  return permissions[role].includes(action)
}

export function assertCan(role: Role, action: Action) {
  if (!can(role, action)) {
    const error = new Error("Forbidden")
    error.name = "ForbiddenError"
    throw error
  }
}
