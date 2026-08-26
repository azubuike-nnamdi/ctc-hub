import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { canWriteJourney } from "@/lib/auth/rbac"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { memberDetailInclude, serializeMember } from "@/lib/members/serialize"
import {
  assertManualStageAllowed,
  setSoulTrackerStage,
} from "@/lib/soul-tracker/update-stage"
import { memberJourneyUpdateSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { user, branchId } = await requireBranchContext("members:read")
    if (!canWriteJourney(user.role)) {
      return jsonError("You cannot update this member's journey.", 403)
    }

    const { id } = await params
    const member = await prisma.member.findFirst({
      where: { id, branchId },
      include: { soulTracker: true },
    })
    if (!member) {
      return jsonError("Member not found.", 404)
    }
    if (member.isDeleted) {
      return jsonError("Restore this member before making other changes.", 400)
    }

    const { currentStage } = memberJourneyUpdateSchema.parse(
      await request.json()
    )
    assertManualStageAllowed(currentStage)

    await prisma.$transaction(async (tx) => {
      if (!member.soulTracker) {
        await tx.soulTracker.create({
          data: {
            branchId,
            memberId: member.id,
            currentStage,
            stages: {
              create: {
                stage: currentStage,
                note: "Member discipleship journey started",
              },
            },
          },
        })
        return
      }
      await setSoulTrackerStage(tx, member.soulTracker.id, currentStage)
    })

    const updated = await prisma.member.findFirst({
      where: { id, branchId },
      include: memberDetailInclude,
    })
    if (!updated) {
      return jsonError("Member not found.", 404)
    }

    return jsonOk(serializeMember(updated))
  } catch (error) {
    return handleRouteError(error)
  }
}
