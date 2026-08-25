import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireFollowUpMemberContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  createFollowUpActivity,
  serializeFollowUpActivity,
} from "@/lib/follow-up/log-activity"
import { followUpNoteSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireFollowUpMemberContext()
    const { id } = await params
    const record = await prisma.soulTracker.findFirst({
      where: {
        id,
        branchId,
        assignedToId: user.id,
        memberId: { not: null },
      },
    })
    if (!record) {
      return jsonError("Assigned member not found.", 404)
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
      wouldWorshipAgain: null,
    })

    return jsonOk(serializeFollowUpActivity(activity), 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
