import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireFollowUpMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { serializeFollowUpActivity } from "@/lib/follow-up/log-activity"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireFollowUpMemberContext()
    const { id } = await params
    const record = await prisma.soulTracker.findFirst({
      where: {
        id,
        branchId,
        assignedToId: user.id,
        memberId: { not: null },
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            departments: {
              include: { department: { select: { id: true, name: true } } },
            },
          },
        },
        activities: {
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!record?.member) {
      return jsonError("Assigned member not found.", 404)
    }

    return jsonOk({
      id: record.id,
      currentStage: record.currentStage,
      memberId: record.member.id,
      firstName: record.member.firstName,
      lastName: record.member.lastName,
      phone: record.member.phone,
      email: record.member.email,
      departments: record.member.departments.map((row) => row.department),
      activities: record.activities.map(serializeFollowUpActivity),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
