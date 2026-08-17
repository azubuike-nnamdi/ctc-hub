import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const { branchId } = await requireBranchContext("members:read")

    const [total, active, inactive, deleted] = await Promise.all([
      prisma.member.count({ where: { branchId } }),
      prisma.member.count({
        where: { branchId, isDeleted: false, status: "ACTIVE" },
      }),
      prisma.member.count({
        where: { branchId, isDeleted: false, status: "INACTIVE" },
      }),
      prisma.member.count({
        where: { branchId, isDeleted: true },
      }),
    ])

    return jsonOk({ total, active, inactive, deleted })
  } catch (error) {
    return handleRouteError(error)
  }
}
