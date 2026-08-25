import type { Prisma } from "@prisma/client"
import type { SoulStage } from "@/lib/db/enums"
import {
  promoteFirstTimerIfEligible,
  type FirstTimerPromotion,
} from "@/lib/members/from-first-timer"

export async function setSoulTrackerStage(
  tx: Prisma.TransactionClient,
  soulTrackerId: string,
  stage: SoulStage
) {
  const next = await tx.soulTracker.update({
    where: { id: soulTrackerId },
    data: { currentStage: stage },
  })
  const already = await tx.soulStageEvent.findFirst({
    where: { soulTrackerId, stage },
  })
  if (!already) {
    await tx.soulStageEvent.create({
      data: { soulTrackerId, stage },
    })
  }
  const promotion = await promoteFirstTimerIfEligible(tx, soulTrackerId, stage)
  return { tracker: next, promotion }
}

export type { FirstTimerPromotion }
