import { handleRouteError, jsonError, emptyToNull, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { memberSchema, paginationSchema } from "@/lib/validation/schemas"

function memberCodePrefix(slug: string) {
  return slug.slice(0, 3).toUpperCase()
}

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

    const where = {
      branchId,
      ...(chapel ? { chapel: chapel as "ADULT" | "YOUTH" | "JUNIOR" } : {}),
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" } : {}),
      ...(gender ? { gender: gender as "MALE" | "FEMALE" } : {}),
      ...(parsed.q
        ? {
            OR: [
              { firstName: { contains: parsed.q, mode: "insensitive" as const } },
              { lastName: { contains: parsed.q, mode: "insensitive" as const } },
              { phone: { contains: parsed.q } },
              { email: { contains: parsed.q, mode: "insensitive" as const } },
              { memberCode: { contains: parsed.q, mode: "insensitive" as const } },
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

    return jsonOk({ items, total, page: parsed.page, pageSize: parsed.pageSize })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { branchId } = await requireBranchContext("members:write")
    const data = memberSchema.parse(await request.json())

    const member = await prisma.$transaction(async (tx) => {
      const branch = await tx.branch.update({
        where: { id: branchId },
        data: { memberSeq: { increment: 1 } },
      })
      const memberCode = `${memberCodePrefix(branch.slug)}-${String(branch.memberSeq).padStart(4, "0")}`

      return tx.member.create({
        data: {
          branchId,
          memberCode,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: emptyToNull(data.email),
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          address: emptyToNull(data.address),
          chapel: data.chapel,
          dateJoined: new Date(data.dateJoined),
          photoUrl: emptyToNull(data.photoUrl),
        },
      })
    })

    return jsonOk(member, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH() {
  return jsonError("Use /api/members/[id]", 405)
}
