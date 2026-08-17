import {
  emptyToNull,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api/errors"
import { can } from "@/lib/auth/rbac"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  firstTimerSchema,
  firstTimerStatusSchema,
} from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("first-timers:read")
    const { id } = await params
    const firstTimer = await prisma.firstTimer.findFirst({
      where: { id, branchId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        event: { select: { id: true, title: true } },
        activities: {
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        soulTracker: true,
      },
    })
    if (!firstTimer) {
      return jsonError("First timer not found.", 404)
    }
    return jsonOk(firstTimer)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext()
    const { id } = await params
    const existing = await prisma.firstTimer.findFirst({
      where: { id, branchId },
    })
    if (!existing) {
      return jsonError("First timer not found.", 404)
    }

    const body = await request.json()
    if (body.status && !body.firstName) {
      if (
        !can(user.role, "first-timers:follow-up") &&
        !can(user.role, "first-timers:create")
      ) {
        return jsonError("You cannot update follow-up status.", 403)
      }
      if (user.role === "USHER") {
        return jsonError("Ushers cannot update follow-up status.", 403)
      }
      const data = firstTimerStatusSchema.parse(body)
      const updated = await prisma.firstTimer.update({
        where: { id },
        data: {
          status: data.status,
          assignedToId:
            data.assignedToId === undefined
              ? existing.assignedToId
              : emptyToNull(data.assignedToId ?? undefined),
        },
      })
      return jsonOk(updated)
    }

    if (
      !can(user.role, "first-timers:create") ||
      user.role === "USHER" ||
      user.role === "FOLLOW_UP"
    ) {
      if (!can(user.role, "first-timers:follow-up")) {
        return jsonError("You cannot edit this first timer.", 403)
      }
    }

    const data = firstTimerSchema.parse(body)
    const updated = await prisma.firstTimer.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: emptyToNull(data.email),
        address: emptyToNull(data.address),
        gender: data.gender,
        occupation: emptyToNull(data.occupation),
        birthday: emptyToNull(data.birthday),
        ageRange: data.ageRange,
        membershipInterest: data.membershipInterest,
        hearAboutUs: data.hearAboutUs,
        hearAboutOther: data.hearAboutUs.includes("OTHER")
          ? emptyToNull(data.hearAboutOther)
          : null,
        invitedBy: emptyToNull(data.invitedBy),
        eventId: emptyToNull(data.eventId),
        prayerRequest: emptyToNull(data.prayerRequest),
        assignedToId: emptyToNull(data.assignedToId),
        status: data.status ?? existing.status,
      },
    })
    return jsonOk(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
