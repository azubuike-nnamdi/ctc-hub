import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireFollowUpMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { serializeFollowUpActivity } from "@/lib/follow-up/log-activity"
import { firstTimerStatusSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireFollowUpMemberContext()
    const { id } = await params
    const firstTimer = await prisma.firstTimer.findFirst({
      where: { id, branchId, assignedToId: user.id },
      include: {
        activities: {
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!firstTimer) {
      return jsonError("First timer not found.", 404)
    }

    return jsonOk({
      id: firstTimer.id,
      firstName: firstTimer.firstName,
      lastName: firstTimer.lastName,
      phone: firstTimer.phone,
      email: firstTimer.email,
      gender: firstTimer.gender,
      occupation: firstTimer.occupation,
      birthday: firstTimer.birthday,
      ageRange: firstTimer.ageRange,
      membershipInterest: firstTimer.membershipInterest,
      hearAboutUs: firstTimer.hearAboutUs,
      hearAboutOther: firstTimer.hearAboutOther,
      prayerRequest: firstTimer.prayerRequest,
      status: firstTimer.status,
      registeredAt: firstTimer.registeredAt.toISOString(),
      activities: firstTimer.activities.map(serializeFollowUpActivity),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireFollowUpMemberContext()
    const { id } = await params
    const existing = await prisma.firstTimer.findFirst({
      where: { id, branchId, assignedToId: user.id },
    })
    if (!existing) {
      return jsonError("First timer not found.", 404)
    }

    const data = firstTimerStatusSchema.parse(await request.json())
    const updated = await prisma.firstTimer.update({
      where: { id },
      data: { status: data.status },
    })
    return jsonOk({
      id: updated.id,
      status: updated.status,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
