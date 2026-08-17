import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const { branchId } = await requireBranchContext()
    const [followUpUsers, events] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: true,
          OR: [{ branchId }, { role: "SUPER_ADMIN" }],
          role: { in: ["FOLLOW_UP", "ADMIN", "PASTOR", "SUPER_ADMIN"] },
        },
        select: { id: true, firstName: true, lastName: true, role: true },
        orderBy: { firstName: "asc" },
      }),
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
