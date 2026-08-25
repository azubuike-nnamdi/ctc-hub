import { startOfMonth } from "date-fns"

import { emptyToNull, handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireMemberContext } from "@/lib/auth/session"
import { memberCanFollowUp } from "@/lib/departments/follow-up"
import { prisma } from "@/lib/db/prisma"
import { memberListInclude, serializeMember } from "@/lib/members/serialize"
import { memberSelfUpdateSchema } from "@/lib/validation/schemas"

export async function GET() {
  try {
    const { user, member } = await requireMemberContext()
    const monthStart = startOfMonth(new Date())
    const canFollowUp = await memberCanFollowUp(member.id)

    const [
      record,
      lastLoginAt,
      totalSouls,
      soulsThisMonth,
      grouped,
      recentSouls,
      assignedFirstTimers,
      assignedMembers,
    ] = await Promise.all([
      prisma.member.findUniqueOrThrow({
        where: { id: member.id },
        include: memberListInclude,
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { lastLoginAt: true },
      }),
      prisma.soulWin.count({ where: { memberId: member.id } }),
      prisma.soulWin.count({
        where: { memberId: member.id, createdAt: { gte: monthStart } },
      }),
      prisma.soulWin.groupBy({
        by: ["eventType"],
        where: { memberId: member.id },
        _count: { _all: true },
      }),
      prisma.soulWin.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      canFollowUp
        ? prisma.firstTimer.count({
            where: { assignedToId: user.id, branchId: member.branchId },
          })
        : Promise.resolve(0),
      canFollowUp
        ? prisma.soulTracker.count({
            where: {
              assignedToId: user.id,
              branchId: member.branchId,
              memberId: { not: null },
            },
          })
        : Promise.resolve(0),
    ])

    const byEventType = {
      PERSONAL: 0,
      GROWTHNET: 0,
      WINSOME: 0,
    }
    for (const row of grouped) {
      byEventType[row.eventType] = row._count._all
    }

    return jsonOk({
      member: serializeMember(record),
      lastLoginAt: lastLoginAt?.lastLoginAt?.toISOString() ?? null,
      stats: {
        totalSouls,
        soulsThisMonth,
        byEventType,
      },
      followUp: {
        canFollowUp,
        assignedFirstTimers,
        assignedMembers,
      },
      recentSouls: recentSouls.map((soul) => ({
        ...soul,
        createdAt: soul.createdAt.toISOString(),
        updatedAt: soul.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, member } = await requireMemberContext()
    const data = memberSelfUpdateSchema.parse(await request.json())
    const email = data.email.toLowerCase()

    const updated = await prisma.$transaction(async (tx) => {
      const nextMember = await tx.member.update({
        where: { id: member.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: emptyToNull(data.address),
          chapel: data.chapel,
          photoUrl: emptyToNull(data.photoUrl),
        },
        include: memberListInclude,
      })
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email,
        },
      })
      return nextMember
    })

    return jsonOk(serializeMember(updated))
  } catch (error) {
    return handleRouteError(error)
  }
}
