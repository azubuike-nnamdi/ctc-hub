import { emptyToNull, handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { eventSchema, paginationSchema } from "@/lib/validation/schemas"

export async function GET(request: Request) {
  try {
    const { branchId } = await requireBranchContext("events:read")
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
            status: status as "DRAFT" | "SCHEDULED" | "CANCELLED" | "COMPLETED",
          }
        : {}),
      ...(parsed.q
        ? {
            OR: [
              { title: { contains: parsed.q, mode: "insensitive" as const } },
              { venue: { contains: parsed.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startsAt: "asc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      prisma.event.count({ where }),
    ])

    return jsonOk({ items, total, page: parsed.page, pageSize: parsed.pageSize })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user, branchId } = await requireBranchContext("events:write")
    const data = eventSchema.parse(await request.json())

    const event = await prisma.event.create({
      data: {
        branchId,
        title: data.title,
        description: emptyToNull(data.description),
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        venue: data.venue,
        status: data.status ?? "SCHEDULED",
        capacity: data.capacity ?? null,
        createdById: user.id,
      },
    })

    return jsonOk(event, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
