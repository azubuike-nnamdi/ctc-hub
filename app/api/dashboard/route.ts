import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const { branchId } = await requireBranchContext()
    const now = new Date()

    const [
      totalMembers,
      firstTimers,
      activeSoulTracker,
      upcomingEvents,
      recentFirstTimers,
      recentMembers,
      upcomingEventList,
    ] = await Promise.all([
      prisma.member.count({ where: { branchId, status: "ACTIVE" } }),
      prisma.firstTimer.count({ where: { branchId } }),
      prisma.soulTracker.count({ where: { branchId } }),
      prisma.event.count({
        where: { branchId, status: "SCHEDULED", startsAt: { gte: now } },
      }),
      prisma.firstTimer.findMany({
        where: { branchId },
        orderBy: { registeredAt: "desc" },
        take: 5,
      }),
      prisma.member.findMany({
        where: { branchId },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.event.findMany({
        where: { branchId, status: "SCHEDULED", startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 4,
      }),
    ])

    return jsonOk({
      stats: {
        totalMembers,
        firstTimers,
        activeSoulTracker,
        upcomingEvents,
      },
      recentFirstTimers,
      recentMembers,
      upcomingEventList,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
