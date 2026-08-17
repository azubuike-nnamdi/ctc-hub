import type { SoulStage } from "@/lib/db/enums"

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
