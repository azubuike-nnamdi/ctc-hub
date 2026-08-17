import { startOfMonth } from "date-fns"

import { emptyToNull, handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { memberSelfUpdateSchema } from "@/lib/validation/schemas"

function serializeMember(member: {
  id: string
  memberCode: string
  branchId: string
  userId: string | null
  firstName: string
  lastName: string
  phone: string
  email: string | null
  gender: "MALE" | "FEMALE"
  dateOfBirth: Date | null
  address: string | null
  chapel: "ADULT" | "YOUTH" | "JUNIOR"
  dateJoined: Date
  status: "ACTIVE" | "INACTIVE"
  photoUrl: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...member,
    dateOfBirth: member.dateOfBirth?.toISOString() ?? null,
    dateJoined: member.dateJoined.toISOString(),
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const { user, member } = await requireMemberContext()
    const monthStart = startOfMonth(new Date())

    const [lastLoginAt, totalSouls, soulsThisMonth, grouped, recentSouls] =
      await Promise.all([
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
      member: serializeMember(member),
      lastLoginAt: lastLoginAt?.lastLoginAt?.toISOString() ?? null,
      stats: {
        totalSouls,
        soulsThisMonth,
        byEventType,
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
