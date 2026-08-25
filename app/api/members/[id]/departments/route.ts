import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { departmentEligibilityError } from "@/lib/departments/eligibility"
import { prisma } from "@/lib/db/prisma"
import { memberDetailInclude, serializeMember } from "@/lib/members/serialize"
import { hasCompletedSod } from "@/lib/utils/labels"
import { memberDepartmentIdsSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    if (user.role === "USHER") {
      return jsonError("Ushers cannot assign departments.", 403)
    }
    const { id } = await params
    const member = await prisma.member.findFirst({
      where: { id, branchId, isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        soulTracker: { select: { currentStage: true } },
        departments: { select: { departmentId: true } },
      },
    })
    if (!member) {
      return jsonError("Member not found.", 404)
    }

    const { departmentIds } = memberDepartmentIdsSchema.parse(
      await request.json()
    )
    const departments = await prisma.department.findMany({
      where: { branchId, id: { in: departmentIds } },
      select: { id: true },
    })
    if (departments.length !== departmentIds.length) {
      return jsonError("One or more departments were not found.", 400)
    }

    const assignedIds = new Set(
      member.departments.map((item) => item.departmentId)
    )
    const adding = departmentIds.filter(
      (departmentId) => !assignedIds.has(departmentId)
    )
    if (adding.length && !hasCompletedSod(member.soulTracker?.currentStage)) {
      return jsonError(departmentEligibilityError([member]), 400)
    }

    await prisma.$transaction([
      prisma.memberDepartment.deleteMany({
        where: {
          memberId: id,
          departmentId: { notIn: departmentIds },
        },
      }),
      prisma.memberDepartment.createMany({
        data: departmentIds.map((departmentId) => ({
          memberId: id,
          departmentId,
        })),
        skipDuplicates: true,
      }),
    ])

    const updated = await prisma.member.findFirst({
      where: { id, branchId },
      include: memberDetailInclude,
    })
    if (!updated) {
      return jsonError("Member not found.", 404)
    }

    return jsonOk(serializeMember(updated))
  } catch (error) {
    return handleRouteError(error)
  }
}
