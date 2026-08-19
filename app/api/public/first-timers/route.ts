import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { PUBLIC_WINDOW_MS } from "@/lib/auth/constants"
import { clientIp, consumeRateLimit } from "@/lib/auth/rate-limit"
import { FIRST_TIMER_CREATED_BY } from "@/lib/db/enums"
import { prisma } from "@/lib/db/prisma"
import { createFirstTimerRecord } from "@/lib/first-timers/create"
import { publicFirstTimerSchema } from "@/lib/validation/schemas"

/** Intentionally unauthenticated. Visitors submit this without a session. */
export async function POST(request: Request) {
  try {
    await consumeRateLimit(
      `public:first-timers:${clientIp(request)}`,
      10,
      PUBLIC_WINDOW_MS
    )
    const data = publicFirstTimerSchema.parse(await request.json())
    const branch = await prisma.branch.findUnique({
      where: { slug: data.branchSlug },
      select: { id: true, name: true },
    })
    if (!branch) {
      return jsonError("Campus not found.", 404)
    }

    await createFirstTimerRecord({
      branchId: branch.id,
      data,
      createdBy: FIRST_TIMER_CREATED_BY.SELF,
      soulNote: "Registered by self",
    })

    return jsonOk({ message: "Welcome to CTC." }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

export function GET() {
  return jsonError("Method not allowed", 405)
}
