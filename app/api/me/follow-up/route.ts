import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireFollowUpMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  dueFromTracker,
  firstTimerDueOrderBy,
  notConvertedFirstTimerWhere,
  soulTrackerDueOrderBy,
} from "@/lib/follow-up/due"
import { serializeFollowUpActivity } from "@/lib/follow-up/log-activity"

const activityInclude = {
  createdBy: { select: { firstName: true, lastName: true } },
} as const

export async function GET() {
  try {
    const { user, branchId } = await requireFollowUpMemberContext()

    const [firstTimers, souls] = await Promise.all([
      prisma.firstTimer.findMany({
        where: {
          assignedToId: user.id,
          branchId,
          ...notConvertedFirstTimerWhere(),
        },
        include: {
          soulTracker: true,
          activities: {
            include: activityInclude,
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: firstTimerDueOrderBy(),
      }),
      prisma.soulTracker.findMany({
        where: {
          assignedToId: user.id,
          branchId,
          memberId: { not: null },
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              departments: {
                include: { department: { select: { id: true, name: true } } },
              },
            },
          },
          activities: {
            include: activityInclude,
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: soulTrackerDueOrderBy(),
      }),
    ])

    return jsonOk({
      firstTimers: firstTimers.map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        phone: item.phone,
        email: item.email,
        gender: item.gender,
        status: item.status,
        registeredAt: item.registeredAt.toISOString(),
        nextContactAt: dueFromTracker(item.soulTracker),
        prayerRequest: item.prayerRequest,
        membershipInterest: item.membershipInterest,
        recentActivities: item.activities.map(serializeFollowUpActivity),
      })),
      members: souls.flatMap((item) => {
        if (!item.member) {
          return []
        }
        return [
          {
            id: item.id,
            memberId: item.member.id,
            firstName: item.member.firstName,
            lastName: item.member.lastName,
            phone: item.member.phone,
            currentStage: item.currentStage,
            nextContactAt: dueFromTracker(item),
            departments: item.member.departments.map((row) => row.department),
            recentActivities: item.activities.map(serializeFollowUpActivity),
          },
        ]
      }),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
