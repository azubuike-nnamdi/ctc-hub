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
    const firstTimer = await prisma.firstTimer.findFirst({
      where: { id, branchId, assignedToId: user.id },
      include: { soulTracker: true },
    })
    if (!firstTimer) {
      return jsonError("First timer not found.", 404)
    }

    const data = followUpNoteSchema.parse(await request.json())
    if (data.status) {
      await prisma.firstTimer.update({
        where: { id },
        data: { status: data.status },
      })
    }

    const activity = await createFollowUpActivity({
      branchId,
      createdById: user.id,
      firstTimerId: id,
      soulTrackerId: firstTimer.soulTracker?.id,
      type: data.type,
      note: data.note,
      contactedAt: data.contactedAt,
      wouldWorshipAgain: data.wouldWorshipAgain,
      nextContactAt: data.nextContactAt,
      closeFollowUp: data.closeFollowUp,
    })

    return jsonOk(serializeFollowUpActivity(activity), 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
