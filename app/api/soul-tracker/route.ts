import { handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { paginationSchema } from "@/lib/validation/schemas"
import { SOUL_STAGE_LABELS } from "@/lib/utils/labels"
import type { SoulStage } from "@/lib/db/enums"

export async function GET(request: Request) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:read")
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    })
    const stage = searchParams.get("stage") as SoulStage | null

    const where = {
      branchId,
      ...(stage ? { currentStage: stage } : {}),
      ...(parsed.q
        ? {
            OR: [
              {
                firstTimer: {
                  OR: [
                    { firstName: { contains: parsed.q, mode: "insensitive" as const } },
                    { lastName: { contains: parsed.q, mode: "insensitive" as const } },
                  ],
                },
              },
              {
                member: {
                  OR: [
                    { firstName: { contains: parsed.q, mode: "insensitive" as const } },
                    { lastName: { contains: parsed.q, mode: "insensitive" as const } },
                    { memberCode: { contains: parsed.q, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.soulTracker.findMany({
        where,
        include: {
          firstTimer: true,
          member: true,
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      prisma.soulTracker.count({ where }),
    ])

    return jsonOk({
      items: items.map((item) => ({
        ...item,
        stageLabel: SOUL_STAGE_LABELS[item.currentStage],
        personName: item.member
          ? `${item.member.firstName} ${item.member.lastName}`
          : item.firstTimer
            ? `${item.firstTimer.firstName} ${item.firstTimer.lastName}`
            : "Unknown",
      })),
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
