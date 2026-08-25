import type { Prisma } from "@/lib/generated/prisma"
import type { SoulStage } from "@/lib/db/enums"

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
  return next
}
