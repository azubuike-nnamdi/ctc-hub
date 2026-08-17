import { emptyToNull } from "@/lib/api/errors"
import {
  FIRST_TIMER_CREATED_BY,
  SOUL_STAGE,
  type FirstTimerCreatedBy,
} from "@/lib/db/enums"
import { prisma } from "@/lib/db/prisma"
import type { firstTimerVisitorSchema } from "@/lib/validation/schemas"
import type { z } from "zod"

type VisitorValues = z.infer<typeof firstTimerVisitorSchema>

export async function createFirstTimerRecord({
  branchId,
  data,
  createdBy,
  createdByUserId,
  assignedToId,
  eventId,
  invitedBy,
  address,
  soulNote,
}: {
  branchId: string
  data: VisitorValues
  createdBy: FirstTimerCreatedBy
  createdByUserId?: string | null
  assignedToId?: string | null
  eventId?: string | null
  invitedBy?: string | null
  address?: string | null
  soulNote: string
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.firstTimer.create({
      data: {
        branchId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: emptyToNull(data.email),
        address: emptyToNull(address),
        gender: data.gender,
        occupation: emptyToNull(data.occupation),
        birthday: emptyToNull(data.birthday),
        ageRange: data.ageRange,
        membershipInterest: data.membershipInterest,
        hearAboutUs: data.hearAboutUs,
        hearAboutOther: data.hearAboutUs.includes("OTHER")
          ? emptyToNull(data.hearAboutOther)
          : null,
        invitedBy: emptyToNull(invitedBy),
        eventId: emptyToNull(eventId),
        prayerRequest: emptyToNull(data.prayerRequest),
        assignedToId: emptyToNull(assignedToId),
        createdBy,
        createdByUserId:
          createdBy === FIRST_TIMER_CREATED_BY.STAFF
            ? emptyToNull(createdByUserId)
            : null,
      },
    })

    await tx.soulTracker.create({
      data: {
        branchId,
        firstTimerId: created.id,
        currentStage: SOUL_STAGE.FIRST_TIMER,
        assignedToId: created.assignedToId,
        stages: {
          create: {
            stage: SOUL_STAGE.FIRST_TIMER,
            note: soulNote,
          },
        },
      },
    })

    return created
  })
}
