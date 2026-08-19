import { cookies } from "next/headers"
import { z } from "zod"

import { BRANCH_COOKIE } from "@/lib/auth/branch"
import { authCookieOptions } from "@/lib/auth/cookies"
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

const schema = z.object({
  branchId: z.string().min(1),
})

export async function GET() {
  try {
    const user = await requireApiUser()
    if (user.role !== "SUPER_ADMIN") {
      return jsonError("Only super admins can list all branches.", 403)
    }

    const items = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    return jsonOk({ items })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser()
    if (user.role !== "SUPER_ADMIN") {
      return jsonError("Only super admins can switch branches.", 403)
    }

    const body = schema.parse(await request.json())
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId },
    })
    if (!branch) {
      return jsonError("Branch not found.", 404)
    }

    const store = await cookies()
    store.set(
      BRANCH_COOKIE,
      body.branchId,
      authCookieOptions(60 * 60 * 24 * 365)
    )

    return jsonOk({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
