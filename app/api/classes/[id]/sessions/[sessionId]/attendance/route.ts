import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  classDb,
  classDetailInclude,
  recordClassAttendance,
} from "@/lib/classes/enroll"
import { serializeClassDetail } from "@/lib/classes/serialize"
import { sendMembershipEmails } from "@/lib/members/from-first-timer"
import { discipleshipAttendanceBatchSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string; sessionId: string }> }

function attendanceEntries(
  parsed: ReturnType<typeof discipleshipAttendanceBatchSchema.parse>
) {
  return "entries" in parsed ? parsed.entries : [parsed]
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("soul-tracker:write")
    const { id, sessionId } = await params
    const entries = attendanceEntries(
      discipleshipAttendanceBatchSchema.parse(await request.json())
    )

    const promotions = []
    for (const entry of entries) {
      const result = await recordClassAttendance(prisma, {
        classId: id,
        branchId,
        sessionId,
        enrollmentId: entry.enrollmentId,
        present: entry.present,
        markedById: user.id,
      })
      promotions.push(...result.promotions)
    }

    for (const promotion of promotions) {
      if (promotion.welcome) {
        try {
          await sendMembershipEmails(promotion.welcome)
        } catch (error) {
          console.error(error)
        }
      }
    }

    const updated = await classDb(prisma).discipleshipClass.findFirst({
      where: { id, branchId },
      include: classDetailInclude(),
    })
    if (!updated) {
      return jsonError("Class not found.", 404)
    }
    return jsonOk({
      ...serializeClassDetail(updated),
      promotions,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
