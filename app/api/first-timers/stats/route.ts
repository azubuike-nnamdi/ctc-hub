import { startOfMonth } from "date-fns"

import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { firstTimerDueWhere, notConvertedFirstTimerWhere } from "@/lib/follow-up/due"

export async function GET() {
  try {
    const { branchId } = await requireBranchContext("first-timers:read")
    const monthStart = startOfMonth(new Date())
    const now = new Date()

    const [total, newCount, overdue, unassigned, thisMonth, becameMembers] =
      await Promise.all([
        prisma.firstTimer.count({ where: { branchId } }),
        prisma.firstTimer.count({
          where: { branchId, status: "NEW" },
        }),
        prisma.firstTimer.count({
          where: { branchId, ...firstTimerDueWhere("OVERDUE", now) },
        }),
        prisma.firstTimer.count({
          where: {
            branchId,
            assignedToId: null,
            ...notConvertedFirstTimerWhere(),
          },
        }),
        prisma.firstTimer.count({
          where: { branchId, registeredAt: { gte: monthStart } },
        }),
        prisma.firstTimer.count({
          where: { branchId, status: "MEMBER" },
        }),
      ])

    return jsonOk({
      total,
      new: newCount,
      overdue,
      unassigned,
      thisMonth,
      becameMembers,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
