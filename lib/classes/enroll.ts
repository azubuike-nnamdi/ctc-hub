import type { Prisma } from "@prisma/client"

import { HttpError } from "@/lib/api/errors"
import type { DiscipleshipProgram, SoulStage } from "@/lib/db/enums"
import type { DbClient } from "@/lib/db/prisma"
import { logBecameMemberActivity } from "@/lib/follow-up/log-activity"
import {
  setSoulTrackerStage,
  type FirstTimerPromotion,
} from "@/lib/soul-tracker/update-stage"
import { hasCompletedMip, SOUL_STAGES } from "@/lib/utils/labels"

/**
 * Language-service PrismaClient can lag behind generate for new models.
 * Delegate through this shape instead of reading discipleship* off prisma/tx.
 */
type ClassPerson = {
  id?: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

type ClassRecord = {
  id: string
  branchId: string
  program: DiscipleshipProgram
  title: string
  startsOn: Date
  status: string
  facilitatorName: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy?: { firstName: string; lastName: string }
  sessions: Array<{ id: string; weekNumber: number; meetsOn: Date }>
  enrollments: Array<{
    id: string
    classId: string
    status: string
    soulTrackerId: string
    firstTimerId: string | null
    memberId: string | null
    createdAt: Date
    member?: ClassPerson | null
    firstTimer?: ClassPerson | null
    attendances: Array<{
      id: string
      enrollmentId: string
      sessionId: string
      present: boolean
      markedAt: Date
    }>
  }>
  _count?: { enrollments: number }
}

type ClassTracker = {
  id: string
  currentStage: SoulStage
  memberId: string | null
  firstTimerId: string | null
}

type ClassDb = {
  discipleshipClass: {
    findFirst: (args: object) => Promise<ClassRecord | null>
    findMany: (args: object) => Promise<ClassRecord[]>
    create: (args: object) => Promise<ClassRecord>
    update: (args: object) => Promise<unknown>
    count: (args: object) => Promise<number>
  }
  discipleshipEnrollment: {
    findUnique: (args: object) => Promise<{ id: string } | null>
    findFirst: (args: object) => Promise<{
      id: string
      status: string
      soulTrackerId: string
      firstTimerId: string | null
      memberId: string | null
    } | null>
    findMany: (args: object) => Promise<
      Array<{
        id: string
        status: string
        classId: string
        class: ClassRecord
        attendances: Array<{ sessionId: string; present: boolean }>
      }>
    >
    create: (args: object) => Promise<{ id: string }>
    update: (args: object) => Promise<unknown>
  }
  discipleshipAttendance: {
    upsert: (args: object) => Promise<unknown>
  }
  discipleshipSession: {
    findFirst: (args: object) => Promise<{ id: string; meetsOn: Date } | null>
  }
  soulTracker: {
    findFirst: (args: object) => Promise<ClassTracker | null>
    findMany: (args: object) => Promise<
      Array<{
        id: string
        currentStage: SoulStage
        firstTimer: ClassPerson | null
        member: ClassPerson | null
      }>
    >
  }
}

export function classDb(client: DbClient): ClassDb {
  return client as unknown as ClassDb
}

export const ACTIVE_CLASS_STATUSES = ["OPEN", "IN_PROGRESS"] as const

export function inProgressStage(program: DiscipleshipProgram): SoulStage {
  return program === "MIP" ? "MIP_IN_PROGRESS" : "SOD_IN_PROGRESS"
}

export function completedStage(program: DiscipleshipProgram): SoulStage {
  return program === "MIP" ? "MIP_COMPLETED" : "SOD_COMPLETED"
}

export function stageRank(stage: SoulStage) {
  return SOUL_STAGES.indexOf(stage)
}

export function canEnrollInProgram(stage: SoulStage, program: DiscipleshipProgram) {
  if (program === "MIP") {
    return stageRank(stage) < stageRank("MIP_COMPLETED")
  }
  return hasCompletedMip(stage) && stageRank(stage) < stageRank("SOD_COMPLETED")
}

export function sodRegisterBlockReason(stage: SoulStage | null | undefined) {
  if (!stage || !hasCompletedMip(stage)) {
    return "Complete MIP before you can register for SOD."
  }
  if (stageRank(stage) >= stageRank("SOD_COMPLETED")) {
    return "You have already completed SOD."
  }
  return null
}

export function enrollmentPerson(enrollment: {
  member?: { firstName: string; lastName: string; phone: string; email: string | null } | null
  firstTimer?: { firstName: string; lastName: string; phone: string; email: string | null } | null
  soulTracker?: {
    member?: { firstName: string; lastName: string; phone: string; email: string | null } | null
    firstTimer?: { firstName: string; lastName: string; phone: string; email: string | null } | null
  } | null
}) {
  const person =
    enrollment.member ??
    enrollment.firstTimer ??
    enrollment.soulTracker?.member ??
    enrollment.soulTracker?.firstTimer
  if (!person) {
    return { firstName: "Unknown", lastName: "", phone: "", email: null as string | null }
  }
  return person
}

const classInclude = {
  createdBy: { select: { firstName: true, lastName: true } },
  sessions: { orderBy: { weekNumber: "asc" as const } },
  enrollments: {
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
      firstTimer: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
      attendances: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const

export function classDetailInclude() {
  return classInclude
}

export async function enrollSoulInClass(
  tx: Prisma.TransactionClient,
  input: {
    classId: string
    branchId: string
    soulTrackerId: string
  }
) {
  const db = classDb(tx)
  const [record, tracker] = await Promise.all([
    db.discipleshipClass.findFirst({
      where: { id: input.classId, branchId: input.branchId },
    }),
    db.soulTracker.findFirst({
      where: { id: input.soulTrackerId, branchId: input.branchId },
      include: { member: true, firstTimer: true },
    }),
  ])

  if (!record) {
    throw new HttpError("Class not found.", 404)
  }
  if (record.status === "COMPLETED" || record.status === "CANCELLED") {
    throw new HttpError("This class is no longer open.", 400)
  }
  if (!tracker) {
    throw new HttpError("Person not found.", 404)
  }
  if (!canEnrollInProgram(tracker.currentStage, record.program)) {
    throw new HttpError(
      record.program === "SOD"
        ? "This person must complete MIP before SOD, and must not already have finished SOD."
        : "This person has already completed MIP.",
      400
    )
  }

  const existingInClass = await db.discipleshipEnrollment.findUnique({
    where: {
      classId_soulTrackerId: {
        classId: record.id,
        soulTrackerId: tracker.id,
      },
    },
  })
  if (existingInClass) {
    throw new HttpError("This person is already on the roster.", 400)
  }

  const activeElsewhere = await db.discipleshipEnrollment.findFirst({
    where: {
      soulTrackerId: tracker.id,
      status: "REGISTERED",
      class: {
        program: record.program,
        status: { in: [...ACTIVE_CLASS_STATUSES] },
        id: { not: record.id },
      },
    },
  })
  if (activeElsewhere) {
    throw new HttpError(
      `This person is already registered for another ${record.program} class.`,
      400
    )
  }

  const enrollment = await db.discipleshipEnrollment.create({
    data: {
      classId: record.id,
      soulTrackerId: tracker.id,
      memberId: tracker.memberId,
      firstTimerId: tracker.firstTimerId,
    },
  })

  const nextStage = inProgressStage(record.program)
  if (stageRank(tracker.currentStage) < stageRank(nextStage)) {
    await setSoulTrackerStage(tx, tracker.id, nextStage)
  }

  if (record.status === "DRAFT") {
    await db.discipleshipClass.update({
      where: { id: record.id },
      data: { status: "OPEN" },
    })
  }

  return enrollment
}

async function promoteMipEnrollment(
  dbClient: DbClient,
  input: {
    enrollment: {
      id: string
      soulTrackerId: string
      firstTimerId: string | null
    }
    branchId: string
    markedById: string
    meetsOn: Date
  }
) {
  const db = classDb(dbClient)
  const result = await setSoulTrackerStage(
    dbClient,
    input.enrollment.soulTrackerId,
    "MIP_COMPLETED",
    { fromClass: true, joinedAt: input.meetsOn }
  )
  const memberId =
    result.promotion?.memberId ??
    (
      await db.soulTracker.findFirst({
        where: { id: input.enrollment.soulTrackerId },
      })
    )?.memberId ??
    null
  await db.discipleshipEnrollment.update({
    where: { id: input.enrollment.id },
    data: {
      status: "COMPLETED",
      memberId,
    },
  })
  if (input.enrollment.firstTimerId) {
    await logBecameMemberActivity(dbClient, {
      branchId: input.branchId,
      createdById: input.markedById,
      firstTimerId: input.enrollment.firstTimerId,
      soulTrackerId: input.enrollment.soulTrackerId,
      meetsOn: input.meetsOn,
    })
  }
  return result.promotion ?? null
}

export async function recordClassAttendance(
  dbClient: DbClient,
  input: {
    classId: string
    branchId: string
    sessionId: string
    enrollmentId: string
    present: boolean
    markedById: string
  }
) {
  const db = classDb(dbClient)
  const [record, session, enrollment] = await Promise.all([
    db.discipleshipClass.findFirst({
      where: { id: input.classId, branchId: input.branchId },
    }),
    db.discipleshipSession.findFirst({
      where: { id: input.sessionId, classId: input.classId },
    }),
    db.discipleshipEnrollment.findFirst({
      where: { id: input.enrollmentId, classId: input.classId },
    }),
  ])

  if (!record) {
    throw new HttpError("Class not found.", 404)
  }
  if (record.status === "COMPLETED" || record.status === "CANCELLED") {
    throw new HttpError("Attendance is locked for this class.", 400)
  }
  if (!session) {
    throw new HttpError("Session not found.", 404)
  }
  if (!enrollment || enrollment.status === "DROPPED") {
    throw new HttpError("This person is not on the roster.", 400)
  }

  await db.discipleshipAttendance.upsert({
    where: {
      enrollmentId_sessionId: {
        enrollmentId: input.enrollmentId,
        sessionId: input.sessionId,
      },
    },
    create: {
      enrollmentId: input.enrollmentId,
      sessionId: input.sessionId,
      present: input.present,
      markedById: input.markedById,
    },
    update: {
      present: input.present,
      markedById: input.markedById,
      markedAt: new Date(),
    },
  })

  if (record.status === "OPEN" || record.status === "DRAFT") {
    await db.discipleshipClass.update({
      where: { id: record.id },
      data: { status: "IN_PROGRESS" },
    })
  }

  const promotions: FirstTimerPromotion[] = []
  if (
    record.program === "MIP" &&
    input.present &&
    enrollment.status === "REGISTERED"
  ) {
    const promotion = await promoteMipEnrollment(dbClient, {
      enrollment,
      branchId: input.branchId,
      markedById: input.markedById,
      meetsOn: session.meetsOn,
    })
    if (promotion) {
      promotions.push(promotion)
    }
  }

  return { promotions }
}

export async function completeDiscipleshipClass(
  dbClient: DbClient,
  classId: string,
  branchId: string,
  completedById: string
) {
  const db = classDb(dbClient)
  const record = await db.discipleshipClass.findFirst({
    where: { id: classId, branchId },
    include: {
      sessions: { orderBy: { weekNumber: "asc" as const } },
      enrollments: { include: { attendances: true } },
    },
  })
  if (!record) {
    throw new HttpError("Class not found.", 404)
  }
  if (record.status === "COMPLETED") {
    throw new HttpError("This class is already completed.", 400)
  }
  if (record.status === "CANCELLED") {
    throw new HttpError("This class was cancelled.", 400)
  }

  const promotions: FirstTimerPromotion[] = []
  const mipSunday = record.sessions?.[0]?.meetsOn ?? record.startsOn

  if (record.program === "MIP") {
    for (const enrollment of record.enrollments) {
      if (enrollment.status === "DROPPED") {
        continue
      }
      const present = enrollment.attendances?.some((row) => row.present)
      if (present) {
        if (enrollment.status === "REGISTERED") {
          const promotion = await promoteMipEnrollment(dbClient, {
            enrollment,
            branchId,
            markedById: completedById,
            meetsOn: mipSunday,
          })
          if (promotion) {
            promotions.push(promotion)
          }
        }
      } else if (enrollment.status === "REGISTERED") {
        await db.discipleshipEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "DROPPED" },
        })
      }
    }
  } else {
    const nextStage = completedStage(record.program)
    for (const enrollment of record.enrollments) {
      if (enrollment.status !== "REGISTERED") {
        continue
      }
      await db.discipleshipEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED" },
      })
      const result = await setSoulTrackerStage(dbClient, enrollment.soulTrackerId, nextStage, {
        fromClass: true,
      })
      if (result.promotion) {
        promotions.push(result.promotion)
      }
    }
  }

  await db.discipleshipClass.update({
    where: { id: classId },
    data: { status: "COMPLETED" },
  })

  return { promotions }
}
