import { startOfMonth } from "date-fns"

import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const { branchId } = await requireBranchContext("first-timers:read")
    const monthStart = startOfMonth(new Date())

    const [total, newCount, inFollowUp, treasureHunt, thisMonth] =
      await Promise.all([
        prisma.firstTimer.count({ where: { branchId } }),
        prisma.firstTimer.count({
          where: { branchId, status: "NEW" },
        }),
        prisma.firstTimer.count({
          where: {
            branchId,
            status: { in: ["CONTACTED", "VISITED", "RETURNED"] },
          },
        }),
        prisma.firstTimer.count({
          where: { branchId, status: "TREASURE_HUNT" },
        }),
        prisma.firstTimer.count({
          where: { branchId, registeredAt: { gte: monthStart } },
        }),
      ])

    return jsonOk({
      total,
      new: newCount,
      inFollowUp,
      treasureHunt,
      thisMonth,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
