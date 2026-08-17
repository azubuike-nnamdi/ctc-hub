import { emptyToNull, handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { memberSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("members:read")
    const { id } = await params
    const member = await prisma.member.findFirst({
      where: { id, branchId },
      include: { soulTracker: true },
    })
    if (!member) {
      return jsonError("Member not found.", 404)
    }
    return jsonOk(member)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    if (user.role === "USHER") {
      return jsonError("Ushers can register members but cannot edit them.", 403)
    }
    const { id } = await params
    const existing = await prisma.member.findFirst({ where: { id, branchId } })
    if (!existing) {
      return jsonError("Member not found.", 404)
    }

    const body = await request.json()
    if (body.status === "INACTIVE" || body.status === "ACTIVE") {
      const member = await prisma.member.update({
        where: { id },
        data: { status: body.status },
      })
      return jsonOk(member)
    }

    const data = memberSchema.parse(body)
    const member = await prisma.member.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: emptyToNull(data.email),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: emptyToNull(data.address),
        chapel: data.chapel,
        dateJoined: new Date(data.dateJoined),
        photoUrl: emptyToNull(data.photoUrl),
        status: data.status ?? existing.status,
      },
    })
    return jsonOk(member)
  } catch (error) {
    return handleRouteError(error)
  }
}
