import type { Prisma } from "@prisma/client"
import { format } from "date-fns"
import type { FollowUpType } from "@/lib/db/enums"
import { prisma, type DbClient } from "@/lib/db/prisma"
import { scheduleAfterActivity } from "@/lib/follow-up/due"

/**
 * Language-service Prisma.TransactionClient can lag behind generate
 * (FollowUpType.MEMBERSHIP). Delegate writes through this so tsc and the IDE agree.
 */
function prismaArg<T>(value: object): T {
  return value as unknown as T
}

export function parseContactedAt(value?: string | null) {
  if (!value) {
    return new Date()
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

export async function createFollowUpActivity(input: {
  branchId: string
  createdById: string
  firstTimerId?: string | null
  soulTrackerId?: string | null
  type: FollowUpType
  note: string
  contactedAt?: string | null
  wouldWorshipAgain?: boolean | null
  nextContactAt?: string | null
  closeFollowUp?: boolean
}) {
  const activity = await prisma.followUpActivity.create({
    data: prismaArg<Prisma.FollowUpActivityUncheckedCreateInput>({
      branchId: input.branchId,
      firstTimerId: input.firstTimerId ?? null,
      soulTrackerId: input.soulTrackerId ?? null,
      type: input.type,
      note: input.note,
      contactedAt: parseContactedAt(input.contactedAt),
      wouldWorshipAgain:
        input.wouldWorshipAgain === undefined ? null : input.wouldWorshipAgain,
      createdById: input.createdById,
    }),
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  })
  if (input.soulTrackerId && input.type !== "MEMBERSHIP") {
    await scheduleAfterActivity(prisma, input.soulTrackerId, {
      closeFollowUp: input.closeFollowUp,
      nextContactAt: input.nextContactAt,
    })
  }
  return activity
}

export async function logBecameMemberActivity(
  tx: DbClient,
  input: {
    branchId: string
    createdById: string
    firstTimerId: string
    soulTrackerId: string
    meetsOn: Date
  }
) {
  const existing = await tx.followUpActivity.findFirst({
    where: prismaArg<Prisma.FollowUpActivityWhereInput>({
      soulTrackerId: input.soulTrackerId,
      type: "MEMBERSHIP" satisfies FollowUpType,
    }),
    select: { id: true },
  })
  if (existing) {
    return
  }
  await tx.followUpActivity.create({
    data: prismaArg<Prisma.FollowUpActivityUncheckedCreateInput>({
      branchId: input.branchId,
      firstTimerId: input.firstTimerId,
      soulTrackerId: input.soulTrackerId,
      type: "MEMBERSHIP" satisfies FollowUpType,
      note: `Moved from first timer to member after attending MIP on ${format(input.meetsOn, "d MMMM yyyy")}.`,
      contactedAt: input.meetsOn,
      createdById: input.createdById,
    }),
  })
}

type FollowUpActivityInput = {
  id: string
  type: FollowUpType | string
  note: string
  createdAt: Date | string
  createdBy: { firstName: string; lastName: string }
  contactedAt?: Date | string
  wouldWorshipAgain?: boolean | null
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function serializeFollowUpActivity(activity: FollowUpActivityInput) {
  const contactedAt = toDate(activity.contactedAt ?? activity.createdAt)
  return {
    id: activity.id,
    type: activity.type,
    note: activity.note,
    contactedAt: contactedAt.toISOString(),
    wouldWorshipAgain: activity.wouldWorshipAgain ?? null,
    createdAt: toDate(activity.createdAt).toISOString(),
    createdBy: activity.createdBy,
  }
}
