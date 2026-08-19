import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { followUpNoteSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext(
      "first-timers:follow-up"
    )
    const { id } = await params
    const firstTimer = await prisma.firstTimer.findFirst({
      where: { id, branchId },
      include: { soulTracker: true },
    })
    if (!firstTimer) {
      return jsonError("First timer not found.", 404)
    }

    const data = followUpNoteSchema.parse(await request.json())
    const activity = await prisma.followUpActivity.create({
      data: {
        branchId,
        firstTimerId: id,
        soulTrackerId: firstTimer.soulTracker?.id,
        type: data.type,
        note: data.note,
        createdById: user.id,
      },
    })

    return jsonOk(activity, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
