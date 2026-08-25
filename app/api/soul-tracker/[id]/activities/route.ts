import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { createFollowUpActivity } from "@/lib/follow-up/log-activity"
import { followUpNoteSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("soul-tracker:write")
    const { id } = await params
    const record = await prisma.soulTracker.findFirst({
      where: { id, branchId },
    })
    if (!record) {
      return jsonError("Soul tracker record not found.", 404)
    }

    const data = followUpNoteSchema.parse(await request.json())
    const activity = await createFollowUpActivity({
      branchId,
      createdById: user.id,
      soulTrackerId: id,
      firstTimerId: record.firstTimerId,
      type: data.type,
      note: data.note,
      contactedAt: data.contactedAt,
      wouldWorshipAgain: data.wouldWorshipAgain,
    })

    return jsonOk(activity, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
