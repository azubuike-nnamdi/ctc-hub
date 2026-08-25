import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { can } from "@/lib/auth/rbac"
import { requireBranchContext } from "@/lib/auth/session"
import { findFollowUpUsers } from "@/lib/departments/follow-up"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const { user, branchId } = await requireBranchContext()
    if (
      !can(user.role, "first-timers:read") &&
      !can(user.role, "soul-tracker:read")
    ) {
      return jsonError("You do not have permission to do that.", 403)
    }

    const [followUpUsers, events] = await Promise.all([
      findFollowUpUsers(branchId),
      prisma.event.findMany({
        where: { branchId, status: { in: ["SCHEDULED", "COMPLETED"] } },
        select: { id: true, title: true, startsAt: true },
        orderBy: { startsAt: "desc" },
        take: 50,
      }),
    ])

    return jsonOk({ followUpUsers, events })
  } catch (error) {
    return handleRouteError(error)
  }
}
