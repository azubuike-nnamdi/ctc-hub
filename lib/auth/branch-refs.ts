import { emptyToNull, HttpError } from "@/lib/api/errors"
import { prisma } from "@/lib/db/prisma"

export async function assertAssignedUserInBranch(
  userId: string | null | undefined,
  branchId: string
) {
  const id = emptyToNull(userId)
  if (!id) {
    return
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ branchId }, { role: "SUPER_ADMIN" }],
    },
    select: { id: true },
  })
  if (!user) {
    throw new HttpError("That assignee is not in this campus.", 400)
  }
}

export async function assertEventInBranch(
  eventId: string | null | undefined,
  branchId: string
) {
  const id = emptyToNull(eventId)
  if (!id) {
    return
  }

  const event = await prisma.event.findFirst({
    where: { id, branchId },
    select: { id: true },
  })
  if (!event) {
    throw new HttpError("That event is not in this campus.", 400)
  }
}

export async function assertBranchRefs({
  assignedToId,
  eventId,
  branchId,
}: {
  assignedToId?: string | null
  eventId?: string | null
  branchId: string
}) {
  await assertAssignedUserInBranch(assignedToId, branchId)
  await assertEventInBranch(eventId, branchId)
}
