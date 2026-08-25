import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { serializeDepartment } from "@/lib/departments/serialize"
import { prisma } from "@/lib/db/prisma"
import { departmentSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

function assertCanManageDepartments(role: string) {
  if (role === "USHER") {
    const error = new Error("Forbidden")
    error.name = "ForbiddenError"
    throw error
  }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("members:read")
    const { id } = await params
    const department = await prisma.department.findFirst({
      where: { id, branchId },
      include: {
        members: {
          include: {
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
                status: true,
                isDeleted: true,
              },
            },
          },
          orderBy: { member: { firstName: "asc" } },
        },
      },
    })
    if (!department) {
      return jsonError("Department not found.", 404)
    }

    return jsonOk({
      id: department.id,
      branchId: department.branchId,
      name: department.name,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
      memberCount: department.members.length,
      members: department.members.map(
        (item: {
          createdAt: Date
          member: {
            id: string
            memberCode: string
            firstName: string
            lastName: string
            status: string
            isDeleted: boolean
          }
        }) => ({
          ...item.member,
          assignedAt: item.createdAt.toISOString(),
        })
      ),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    assertCanManageDepartments(user.role)
    const { id } = await params
    const existing = await prisma.department.findFirst({
      where: { id, branchId },
      select: { id: true },
    })
    if (!existing) {
      return jsonError("Department not found.", 404)
    }

    const { name } = departmentSchema.parse(await request.json())
    const duplicate = await prisma.department.findFirst({
      where: {
        branchId,
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
      },
      select: { id: true },
    })
    if (duplicate) {
      return jsonError("A department with that name already exists.", 409)
    }

    const updated = await prisma.department.update({
      where: { id },
      data: { name },
      include: { _count: { select: { members: true } } },
    })

    return jsonOk(serializeDepartment(updated))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    assertCanManageDepartments(user.role)
    const { id } = await params
    const existing = await prisma.department.findFirst({
      where: { id, branchId },
      select: { id: true },
    })
    if (!existing) {
      return jsonError("Department not found.", 404)
    }

    await prisma.department.delete({ where: { id } })
    return jsonOk({ id })
  } catch (error) {
    return handleRouteError(error)
  }
}
