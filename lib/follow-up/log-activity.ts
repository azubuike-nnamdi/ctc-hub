import type { FollowUpType } from "@/lib/db/enums"
import { prisma } from "@/lib/db/prisma"

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
}) {
  return prisma.followUpActivity.create({
    data: {
      branchId: input.branchId,
      firstTimerId: input.firstTimerId ?? null,
      soulTrackerId: input.soulTrackerId ?? null,
      type: input.type,
      note: input.note,
      contactedAt: parseContactedAt(input.contactedAt),
      wouldWorshipAgain:
        input.wouldWorshipAgain === undefined ? null : input.wouldWorshipAgain,
      createdById: input.createdById,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
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
