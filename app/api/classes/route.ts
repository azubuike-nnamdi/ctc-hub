import { emptyToNull, handleRouteError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import type { DiscipleshipProgram } from "@/lib/db/enums"
import { classDb } from "@/lib/classes/enroll"
import { serializeClassSummary } from "@/lib/classes/serialize"
import {
  buildClassSessions,
  defaultClassTitle,
  parseDateOnly,
  sundayOnOrAfter,
} from "@/lib/classes/sessions"
import {
  discipleshipClassCreateSchema,
  paginationSchema,
} from "@/lib/validation/schemas"

export async function GET(request: Request) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:read")
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    })
    const program = searchParams.get("program") as DiscipleshipProgram | null
    const status = searchParams.get("status")

    const where = {
      branchId,
      ...(program === "MIP" || program === "SOD" ? { program } : {}),
      ...(status ? { status: status as never } : {}),
      ...(parsed.q
        ? {
            title: { contains: parsed.q, mode: "insensitive" as const },
          }
        : {}),
    }

    const db = classDb(prisma)
    const [items, total] = await Promise.all([
      db.discipleshipClass.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          sessions: {
            orderBy: { weekNumber: "asc" },
            select: { id: true, weekNumber: true, meetsOn: true },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { startsOn: "desc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      db.discipleshipClass.count({ where }),
    ])

    return jsonOk({
      items: items.map(serializeClassSummary),
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
    const { user, branchId } = await requireBranchContext("soul-tracker:write")
    const data = discipleshipClassCreateSchema.parse(await request.json())
    const firstSunday = sundayOnOrAfter(parseDateOnly(data.firstSunday))
    const sessions = buildClassSessions(data.program, firstSunday)
    const title =
      data.title && data.title.trim()
        ? data.title.trim()
        : defaultClassTitle(data.program, firstSunday)

    const record = await classDb(prisma).discipleshipClass.create({
      data: {
        branchId,
        program: data.program,
        title,
        startsOn: firstSunday,
        facilitatorName: emptyToNull(data.facilitatorName),
        createdById: user.id,
        sessions: { create: sessions },
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        sessions: {
          orderBy: { weekNumber: "asc" },
          select: { id: true, weekNumber: true, meetsOn: true },
        },
        _count: { select: { enrollments: true } },
      },
    })

    return jsonOk(serializeClassSummary(record), 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
