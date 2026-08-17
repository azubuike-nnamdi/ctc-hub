import { emptyToNull, handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { soulTrackerUpdateSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:read")
    const { id } = await params
    const record = await prisma.soulTracker.findFirst({
      where: { id, branchId },
      include: {
        firstTimer: true,
        member: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        stages: { orderBy: { reachedAt: "asc" } },
        activities: {
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!record) {
      return jsonError("Soul tracker record not found.", 404)
    }
    return jsonOk(record)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:write")
    const { id } = await params
    const existing = await prisma.soulTracker.findFirst({
      where: { id, branchId },
    })
    if (!existing) {
      return jsonError("Soul tracker record not found.", 404)
    }

    const data = soulTrackerUpdateSchema.parse(await request.json())
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.soulTracker.update({
        where: { id },
        data: {
          currentStage: data.currentStage ?? existing.currentStage,
          notes: data.notes === undefined ? existing.notes : data.notes,
          assignedToId:
            data.assignedToId === undefined
              ? existing.assignedToId
              : emptyToNull(data.assignedToId ?? undefined),
        },
      })

          if (data.currentStage && data.currentStage !== existing.currentStage) {
            const already = await tx.soulStageEvent.findFirst({
              where: { soulTrackerId: id, stage: data.currentStage },
            })
            if (!already) {
              await tx.soulStageEvent.create({
                data: {
                  soulTrackerId: id,
                  stage: data.currentStage,
                },
              })
            }
          }

      return next
    })

    return jsonOk(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
