import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { FIRST_TIMER_CREATED_BY } from "@/lib/db/enums"
import { prisma } from "@/lib/db/prisma"
import { createFirstTimerRecord } from "@/lib/first-timers/create"
import { firstTimerSchema, paginationSchema } from "@/lib/validation/schemas"

export async function GET(request: Request) {
  try {
    const { branchId } = await requireBranchContext("first-timers:read")
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    })
    const status = searchParams.get("status")

    const where = {
      branchId,
      ...(status
        ? {
            status: status as
              "NEW" | "CONTACTED" | "VISITED" | "RETURNED" | "TREASURE_HUNT",
          }
        : {}),
      ...(parsed.q
        ? {
            OR: [
              {
                firstName: { contains: parsed.q, mode: "insensitive" as const },
              },
              {
                lastName: { contains: parsed.q, mode: "insensitive" as const },
              },
              { phone: { contains: parsed.q } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.firstTimer.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          createdByUser: {
            select: { id: true, firstName: true, lastName: true },
          },
          event: { select: { id: true, title: true } },
        },
        orderBy: { registeredAt: "desc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      prisma.firstTimer.count({ where }),
    ])

    return jsonOk({
      items,
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user, branchId } = await requireBranchContext("first-timers:create")
    const data = firstTimerSchema.parse(await request.json())

    const firstTimer = await createFirstTimerRecord({
      branchId,
      data,
      createdBy: FIRST_TIMER_CREATED_BY.STAFF,
      createdByUserId: user.id,
      assignedToId: data.assignedToId,
      eventId: data.eventId,
      invitedBy: data.invitedBy,
      address: data.address,
      soulNote: `Registered by ${user.firstName} ${user.lastName}`,
    })

    return jsonOk(firstTimer, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

export function PATCH() {
  return jsonError("Use /api/first-timers/[id]", 405)
}
