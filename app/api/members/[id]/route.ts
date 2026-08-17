import {
  emptyToNull,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { memberSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

const deletedBySelect = {
  deletedBy: { select: { firstName: true, lastName: true } },
} as const

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("members:read")
    const { id } = await params
    const member = await prisma.member.findFirst({
      where: { id, branchId },
      include: { soulTracker: true, ...deletedBySelect },
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

    if (body.restore === true) {
      if (!existing.isDeleted) {
        return jsonError("This member is not deleted.", 400)
      }
      const member = await prisma.member.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
          status: "ACTIVE",
        },
        include: deletedBySelect,
      })
      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { isActive: true },
        })
      }
      return jsonOk(member)
    }

    if (existing.isDeleted) {
      return jsonError("Restore this member before making other changes.", 400)
    }

    if (body.status === "INACTIVE" || body.status === "ACTIVE") {
      const member = await prisma.member.update({
        where: { id },
        data: { status: body.status },
        include: deletedBySelect,
      })
      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { isActive: body.status === "ACTIVE" },
        })
      }
      return jsonOk(member)
    }

    const data = memberSchema.parse(body)
    const email = data.email.toLowerCase()
    const member = await prisma.member.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: emptyToNull(data.address),
        chapel: data.chapel,
        dateJoined: new Date(data.dateJoined),
        photoUrl: emptyToNull(data.photoUrl),
        status: data.status ?? existing.status,
      },
      include: deletedBySelect,
    })
    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email,
        },
      })
    }
    return jsonOk(member)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:write")
    if (user.role === "USHER") {
      return jsonError("Ushers cannot delete members.", 403)
    }
    const { id } = await params
    const existing = await prisma.member.findFirst({ where: { id, branchId } })
    if (!existing) {
      return jsonError("Member not found.", 404)
    }
    if (existing.isDeleted) {
      return jsonError("This member is already deleted.", 400)
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user.id,
        status: "INACTIVE",
      },
      include: deletedBySelect,
    })
    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: false },
      })
    }
    return jsonOk(member)
  } catch (error) {
    return handleRouteError(error)
  }
}
