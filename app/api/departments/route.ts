import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { serializeDepartment } from "@/lib/departments/serialize"
import { prisma } from "@/lib/db/prisma"
import { departmentSchema } from "@/lib/validation/schemas"

function assertCanManageDepartments(role: string) {
  if (role === "USHER") {
    const error = new Error("Forbidden")
    error.name = "ForbiddenError"
    throw error
  }
}

export async function GET() {
  try {
    const { branchId } = await requireBranchContext("members:read")
    const items = await prisma.department.findMany({
      where: { branchId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    })

    return jsonOk(items.map(serializeDepartment))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    assertCanManageDepartments(user.role)
    const { name } = departmentSchema.parse(await request.json())

    const existing = await prisma.department.findFirst({
      where: { branchId, name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    })
    if (existing) {
      return jsonError("A department with that name already exists.", 409)
    }

    const created = await prisma.department.create({
      data: { branchId, name },
      include: { _count: { select: { members: true } } },
    })

    return jsonOk(serializeDepartment(created), 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
