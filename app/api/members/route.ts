import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { inviteMember } from "@/lib/members/create"
import { memberSchema, paginationSchema } from "@/lib/validation/schemas"

export async function GET(request: Request) {
  try {
    const { branchId } = await requireBranchContext("members:read")
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    })
    const chapel = searchParams.get("chapel")
    const status = searchParams.get("status")
    const gender = searchParams.get("gender")

    const deletedFilter =
      status === "DELETED"
        ? { isDeleted: true }
        : {
            isDeleted: false,
            ...(status === "ACTIVE" || status === "INACTIVE"
              ? { status: status as "ACTIVE" | "INACTIVE" }
              : {}),
          }

    const where = {
      branchId,
      ...deletedFilter,
      ...(chapel ? { chapel: chapel as "ADULT" | "YOUTH" | "JUNIOR" } : {}),
      ...(gender ? { gender: gender as "MALE" | "FEMALE" } : {}),
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
              { email: { contains: parsed.q, mode: "insensitive" as const } },
              {
                memberCode: {
                  contains: parsed.q,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      prisma.member.count({ where }),
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
    const { branchId } = await requireBranchContext("members:write")
    const data = memberSchema.parse(await request.json())
    const member = await inviteMember({ branchId, data })
    return jsonOk(member, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH() {
  return jsonError("Use /api/members/[id]", 405)
}
