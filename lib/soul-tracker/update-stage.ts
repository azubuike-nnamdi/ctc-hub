import type { SoulStage } from "@/lib/db/enums"
import { HttpError } from "@/lib/api/errors"
import type { DbClient } from "@/lib/db/prisma"
import {
  promoteFirstTimerIfEligible,
  type FirstTimerPromotion,
} from "@/lib/members/from-first-timer"

export const CLASS_COMPLETED_STAGES: SoulStage[] = [
  "MIP_COMPLETED",
  "SOD_COMPLETED",
]

export function isClassCompletedStage(stage: SoulStage) {
  return CLASS_COMPLETED_STAGES.includes(stage)
}

export function assertManualStageAllowed(
  stage: SoulStage,
  options?: { fromClass?: boolean }
) {
  if (options?.fromClass) {
    return
  }
  if (isClassCompletedStage(stage)) {
    throw new HttpError(
      "Mark MIP or SOD complete by finishing the class, not from this dropdown.",
      400
    )
  }
}

export async function setSoulTrackerStage(
  db: DbClient,
  soulTrackerId: string,
  stage: SoulStage,
  options?: { fromClass?: boolean; joinedAt?: Date }
) {
  assertManualStageAllowed(stage, options)
  const next = await db.soulTracker.update({
    where: { id: soulTrackerId },
    data: { currentStage: stage },
  })
  const already = await db.soulStageEvent.findFirst({
    where: { soulTrackerId, stage },
  })
  if (!already) {
    await db.soulStageEvent.create({
      data: { soulTrackerId, stage },
    })
  }
  const promotion = await promoteFirstTimerIfEligible(db, soulTrackerId, stage, {
    joinedAt: options?.joinedAt,
  })
  return { tracker: next, promotion }
}

export type { FirstTimerPromotion }
