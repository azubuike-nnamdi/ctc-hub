import {
  emptyToNull,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api/errors"
import { requireMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { soulWinSchema } from "@/lib/validation/schemas"

export async function POST(request: Request) {
  try {
    const { member, branchId } = await requireMemberContext()
    const data = soulWinSchema.parse(await request.json())

    const soul = await prisma.soulWin.create({
      data: {
        branchId,
        memberId: member.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: emptyToNull(data.email),
        eventType: data.eventType,
      },
    })

    return jsonOk(
      {
        ...soul,
        createdAt: soul.createdAt.toISOString(),
        updatedAt: soul.updatedAt.toISOString(),
      },
      201
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export function GET() {
  return jsonError("Method not allowed", 405)
}
