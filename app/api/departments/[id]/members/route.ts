import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import {
  departmentEligibilityError,
  membersIneligibleForDepartment,
} from "@/lib/departments/eligibility"
import { prisma } from "@/lib/db/prisma"
import { departmentMemberIdsSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

function assertCanManageDepartments(role: string) {
  if (role === "USHER") {
    const error = new Error("Forbidden")
    error.name = "ForbiddenError"
    throw error
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    assertCanManageDepartments(user.role)
    const { id } = await params
    const department = await prisma.department.findFirst({
      where: { id, branchId },
      select: { id: true },
    })
    if (!department) {
      return jsonError("Department not found.", 404)
    }

    const { memberIds } = departmentMemberIdsSchema.parse(await request.json())
    const members = await prisma.member.findMany({
      where: { branchId, id: { in: memberIds }, isDeleted: false },
      select: { id: true },
    })
    if (members.length !== memberIds.length) {
      return jsonError(
        "One or more members were not found in this campus.",
        400
      )
    }

    const ineligible = await membersIneligibleForDepartment(memberIds, branchId)
    if (ineligible.length) {
      return jsonError(departmentEligibilityError(ineligible), 400)
    }

    await prisma.memberDepartment.createMany({
      data: memberIds.map((memberId) => ({
        memberId,
        departmentId: id,
      })),
      skipDuplicates: true,
    })

    return jsonOk({ added: memberIds.length })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    assertCanManageDepartments(user.role)
    const { id } = await params
    const department = await prisma.department.findFirst({
      where: { id, branchId },
      select: { id: true },
    })
    if (!department) {
      return jsonError("Department not found.", 404)
    }

    const { memberIds } = departmentMemberIdsSchema.parse(await request.json())
    await prisma.memberDepartment.deleteMany({
      where: { departmentId: id, memberId: { in: memberIds } },
    })

    return jsonOk({ removed: memberIds.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
