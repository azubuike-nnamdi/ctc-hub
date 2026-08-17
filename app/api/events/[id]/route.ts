import { emptyToNull, handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { eventSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("events:read")
    const { id } = await params
    const event = await prisma.event.findFirst({
      where: { id, branchId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    })
    if (!event) {
      return jsonError("Event not found.", 404)
    }
    return jsonOk(event)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("events:write")
    const { id } = await params
    const existing = await prisma.event.findFirst({ where: { id, branchId } })
    if (!existing) {
      return jsonError("Event not found.", 404)
    }

    const body = await request.json()
    if (body.status === "CANCELLED" && !body.title) {
      const event = await prisma.event.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
      return jsonOk(event)
    }

    const data = eventSchema.parse(body)
    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: emptyToNull(data.description),
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        venue: data.venue,
        status: data.status ?? existing.status,
        capacity: data.capacity ?? null,
      },
    })
    return jsonOk(event)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("events:write")
    const { id } = await params
    const existing = await prisma.event.findFirst({ where: { id, branchId } })
    if (!existing) {
      return jsonError("Event not found.", 404)
    }
    if (existing.status !== "DRAFT" && existing.status !== "CANCELLED") {
      return jsonError("Only draft or cancelled events can be deleted.", 400)
    }
    await prisma.event.delete({ where: { id } })
    return jsonOk({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
