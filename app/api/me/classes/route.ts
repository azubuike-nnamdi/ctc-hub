import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  ACTIVE_CLASS_STATUSES,
  classDb,
  enrollSoulInClass,
  sodRegisterBlockReason,
} from "@/lib/classes/enroll"
import { serializeClassSummary } from "@/lib/classes/serialize"
import { memberClassRegisterSchema } from "@/lib/validation/schemas"

export async function GET() {
  try {
    const { member, branchId } = await requireMemberContext()
    const record = await prisma.member.findUniqueOrThrow({
      where: { id: member.id },
      include: { soulTracker: true },
    })
    const stage = record.soulTracker?.currentStage ?? null
    const blockReason = sodRegisterBlockReason(stage)

    const db = classDb(prisma)
    const enrollments = record.soulTracker
      ? await db.discipleshipEnrollment.findMany({
          where: { soulTrackerId: record.soulTracker.id },
          include: {
            class: {
              include: {
                createdBy: { select: { firstName: true, lastName: true } },
                sessions: {
                  orderBy: { weekNumber: "asc" },
                  select: { id: true, weekNumber: true, meetsOn: true },
                },
                _count: { select: { enrollments: true } },
              },
            },
            attendances: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : []

    const enrolledClassIds = enrollments.map((row) => row.classId)
    const openSodClasses = blockReason
      ? []
      : await db.discipleshipClass.findMany({
          where: {
            branchId,
            program: "SOD",
            status: { in: [...ACTIVE_CLASS_STATUSES] },
            ...(enrolledClassIds.length > 0
              ? { id: { notIn: enrolledClassIds } }
              : {}),
          },
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
            sessions: {
              orderBy: { weekNumber: "asc" },
              select: { id: true, weekNumber: true, meetsOn: true },
            },
            _count: { select: { enrollments: true } },
          },
          orderBy: { startsOn: "asc" },
        })

    return jsonOk({
      member: {
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        phone: record.phone,
      },
      currentStage: stage,
      canRegister: !blockReason,
      blockReason,
      openSodClasses: openSodClasses.map(serializeClassSummary),
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        status: enrollment.status,
        class: serializeClassSummary(enrollment.class),
        attendances: enrollment.attendances.map((row) => ({
          sessionId: row.sessionId,
          present: row.present,
        })),
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { member, branchId } = await requireMemberContext()
    const { classId } = memberClassRegisterSchema.parse(await request.json())
    const record = await prisma.member.findUniqueOrThrow({
      where: { id: member.id },
      include: { soulTracker: true },
    })
    if (!record.soulTracker) {
      return jsonError("Complete MIP before you can register for SOD.", 400)
    }

    const klass = await classDb(prisma).discipleshipClass.findFirst({
      where: { id: classId, branchId },
    })
    if (!klass) {
      return jsonError("Class not found.", 404)
    }
    if (klass.program !== "SOD") {
      return jsonError("Members register themselves for SOD. Staff add people to MIP.", 400)
    }

    const blockReason = sodRegisterBlockReason(record.soulTracker.currentStage)
    if (blockReason) {
      return jsonError(blockReason, 400)
    }

    await prisma.$transaction((tx) =>
      enrollSoulInClass(tx, {
        classId,
        branchId,
        soulTrackerId: record.soulTracker!.id,
      })
    )

    return jsonOk({ classId }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
