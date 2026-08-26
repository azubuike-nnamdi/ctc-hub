import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { ACTIVE_CLASS_STATUSES, classDb } from "@/lib/classes/enroll"
import { SOUL_STAGE_LABELS } from "@/lib/utils/labels"
import type { SoulStage } from "@/lib/db/enums"

type Params = { params: Promise<{ id: string }> }

const MIP_STAGES: SoulStage[] = ["FIRST_TIMER", "FOLLOW_UP", "MIP_IN_PROGRESS"]
const SOD_STAGES: SoulStage[] = ["MIP_COMPLETED", "SOD_IN_PROGRESS"]

export async function GET(request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:read")
    const { id } = await params
    const db = classDb(prisma)
    const record = await db.discipleshipClass.findFirst({
      where: { id, branchId },
      select: { id: true, program: true },
    })
    if (!record) {
      return jsonError("Class not found.", 404)
    }

    const q = new URL(request.url).searchParams.get("q")?.trim() ?? ""
    const stages = record.program === "MIP" ? MIP_STAGES : SOD_STAGES

    const items = await db.soulTracker.findMany({
      where: {
        branchId,
        currentStage: { in: stages },
        discipleshipEnrollments: {
          none: {
            OR: [
              { classId: id },
              {
                status: "REGISTERED",
                class: {
                  program: record.program,
                  status: { in: [...ACTIVE_CLASS_STATUSES] },
                },
              },
            ],
          },
        },
        ...(q
          ? {
              OR: [
                {
                  firstTimer: {
                    OR: [
                      { firstName: { contains: q, mode: "insensitive" as const } },
                      { lastName: { contains: q, mode: "insensitive" as const } },
                      { phone: { contains: q, mode: "insensitive" as const } },
                    ],
                  },
                },
                {
                  member: {
                    OR: [
                      { firstName: { contains: q, mode: "insensitive" as const } },
                      { lastName: { contains: q, mode: "insensitive" as const } },
                      { phone: { contains: q, mode: "insensitive" as const } },
                      { email: { contains: q, mode: "insensitive" as const } },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        firstTimer: {
          select: { firstName: true, lastName: true, phone: true, email: true },
        },
        member: {
          select: { firstName: true, lastName: true, phone: true, email: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    })

    return jsonOk({
      items: items.map((item) => {
        const person = item.member ?? item.firstTimer
        return {
          id: item.id,
          currentStage: item.currentStage,
          stageLabel: SOUL_STAGE_LABELS[item.currentStage],
          firstName: person?.firstName ?? "Unknown",
          lastName: person?.lastName ?? "",
          phone: person?.phone ?? "",
          email: person?.email ?? null,
        }
      }),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
