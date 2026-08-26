import { emptyToNull, handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  classDb,
  classDetailInclude,
  completeDiscipleshipClass,
} from "@/lib/classes/enroll"
import { serializeClassDetail } from "@/lib/classes/serialize"
import { sendMembershipEmails } from "@/lib/members/from-first-timer"
import { discipleshipClassUpdateSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:read")
    const { id } = await params
    const record = await classDb(prisma).discipleshipClass.findFirst({
      where: { id, branchId },
      include: classDetailInclude(),
    })
    if (!record) {
      return jsonError("Class not found.", 404)
    }
    return jsonOk(serializeClassDetail(record))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("soul-tracker:write")
    const { id } = await params
    const db = classDb(prisma)
    const existing = await db.discipleshipClass.findFirst({
      where: { id, branchId },
    })
    if (!existing) {
      return jsonError("Class not found.", 404)
    }

    const data = discipleshipClassUpdateSchema.parse(await request.json())
    if (data.status === "COMPLETED") {
      const { promotions } = await completeDiscipleshipClass(
        prisma,
        id,
        branchId,
        user.id
      )
      for (const promotion of promotions) {
        if (promotion.welcome) {
          try {
            await sendMembershipEmails(promotion.welcome)
          } catch (error) {
            console.error(error)
          }
        }
      }
    } else {
      await db.discipleshipClass.update({
        where: { id },
        data: {
          title: data.title ?? existing.title,
          facilitatorName:
            data.facilitatorName === undefined
              ? existing.facilitatorName
              : emptyToNull(data.facilitatorName),
          status: data.status ?? existing.status,
        },
      })
    }

    const record = await db.discipleshipClass.findFirst({
      where: { id, branchId },
      include: classDetailInclude(),
    })
    if (!record) {
      return jsonError("Class not found.", 404)
    }
    return jsonOk(serializeClassDetail(record))
  } catch (error) {
    return handleRouteError(error)
  }
}
