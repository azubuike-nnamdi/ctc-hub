/**
 * App-level copies of Prisma enums.
 * `@prisma/client` does not export these under bundler/browser resolution,
 * so client and shared code must import from here instead.
 */

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PASTOR"
  | "USHER"
  | "FOLLOW_UP"

export type Chapel = "ADULT" | "YOUTH" | "JUNIOR"

export type MemberStatus = "ACTIVE" | "INACTIVE"

export type Gender = "MALE" | "FEMALE"

export type FirstTimerStatus =
  | "NEW"
  | "CONTACTED"
  | "VISITED"
  | "RETURNED"
  | "TREASURE_HUNT"

export type SoulStage =
  | "FIRST_TIMER"
  | "FOLLOW_UP"
  | "TREASURE_HUNT"
  | "MISSION_IGNITION"
  | "WORKER_TRAINING"
  | "WORKER"
  | "LEADER"

export type EventStatus = "DRAFT" | "SCHEDULED" | "CANCELLED" | "COMPLETED"

export type FollowUpType = "CALL" | "VISIT" | "NOTE"

export const SOUL_STAGE = {
  FIRST_TIMER: "FIRST_TIMER",
  FOLLOW_UP: "FOLLOW_UP",
  TREASURE_HUNT: "TREASURE_HUNT",
  MISSION_IGNITION: "MISSION_IGNITION",
  WORKER_TRAINING: "WORKER_TRAINING",
  WORKER: "WORKER",
  LEADER: "LEADER",
} as const satisfies Record<string, SoulStage>
