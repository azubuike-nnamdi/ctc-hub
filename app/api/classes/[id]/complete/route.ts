import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  classDb,
  classDetailInclude,
  completeDiscipleshipClass,
} from "@/lib/classes/enroll"
import { serializeClassDetail } from "@/lib/classes/serialize"
import { sendMembershipEmails } from "@/lib/members/from-first-timer"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("soul-tracker:write")
    const { id } = await params
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
