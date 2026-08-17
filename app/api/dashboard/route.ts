import { format, startOfMonth, subMonths } from "date-fns"

import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  CHAPEL_LABELS,
  CHAPELS,
  FIRST_TIMER_STATUS_LABELS,
  FIRST_TIMER_STATUSES,
  GENDER_LABELS,
  GENDERS,
  SOUL_STAGE_LABELS,
  SOUL_STAGES,
} from "@/lib/utils/labels"

function seriesFromCounts<T extends string>(
  keys: readonly T[],
  labels: Record<T, string>,
  counts: Map<T, number>
) {
  return keys.map((key) => ({
    label: labels[key],
    count: counts.get(key) ?? 0,
  }))
}

export async function GET() {
  try {
    const { branchId } = await requireBranchContext()
    const now = new Date()
    const sixMonthsAgo = startOfMonth(subMonths(now, 5))

    const [
      totalMembers,
      firstTimers,
      activeSoulTracker,
      upcomingEvents,
      recentFirstTimers,
      recentMembers,
      upcomingEventList,
      membersByChapel,
      firstTimersByStatus,
      soulsByStage,
      membersByGender,
      recentMemberDates,
      recentFirstTimerDates,
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
      prisma.member.groupBy({
        by: ["chapel"],
        where: { branchId },
        _count: { _all: true },
      }),
      prisma.firstTimer.groupBy({
        by: ["status"],
        where: { branchId },
        _count: { _all: true },
      }),
      prisma.soulTracker.groupBy({
        by: ["currentStage"],
        where: { branchId },
        _count: { _all: true },
      }),
      prisma.member.groupBy({
        by: ["gender"],
        where: { branchId, status: "ACTIVE" },
        _count: { _all: true },
      }),
      prisma.member.findMany({
        where: { branchId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.firstTimer.findMany({
        where: { branchId, registeredAt: { gte: sixMonthsAgo } },
        select: { registeredAt: true },
      }),
    ])

    const memberMonths = new Map<string, number>()
    for (const member of recentMemberDates) {
      const key = format(member.createdAt, "yyyy-MM")
      memberMonths.set(key, (memberMonths.get(key) ?? 0) + 1)
    }

    const firstTimerMonths = new Map<string, number>()
    for (const item of recentFirstTimerDates) {
      const key = format(item.registeredAt, "yyyy-MM")
      firstTimerMonths.set(key, (firstTimerMonths.get(key) ?? 0) + 1)
    }

    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = startOfMonth(subMonths(now, 5 - index))
      const key = format(date, "yyyy-MM")
      return {
        month: format(date, "MMM"),
        members: memberMonths.get(key) ?? 0,
        firstTimers: firstTimerMonths.get(key) ?? 0,
      }
    })

    return jsonOk({
      stats: {
        totalMembers,
        firstTimers,
        activeSoulTracker,
        upcomingEvents,
      },
      analytics: {
        monthly,
        membersByChapel: seriesFromCounts(
          CHAPELS,
          CHAPEL_LABELS,
          new Map(membersByChapel.map((row) => [row.chapel, row._count._all]))
        ),
        firstTimersByStatus: seriesFromCounts(
          FIRST_TIMER_STATUSES,
          FIRST_TIMER_STATUS_LABELS,
          new Map(
            firstTimersByStatus.map((row) => [row.status, row._count._all])
          )
        ),
        soulsByStage: seriesFromCounts(
          SOUL_STAGES,
          SOUL_STAGE_LABELS,
          new Map(
            soulsByStage.map((row) => [row.currentStage, row._count._all])
          )
        ),
        membersByGender: seriesFromCounts(
          GENDERS,
          GENDER_LABELS,
          new Map(membersByGender.map((row) => [row.gender, row._count._all]))
        ),
      },
      recentFirstTimers,
      recentMembers,
      upcomingEventList,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
