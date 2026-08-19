import {
  emptyToNull,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api/errors"
import { PUBLIC_WINDOW_MS } from "@/lib/auth/constants"
import { clientIp, consumeRateLimit } from "@/lib/auth/rate-limit"
import { prisma } from "@/lib/db/prisma"
import { supportRequestSchema } from "@/lib/validation/schemas"

/** Intentionally unauthenticated. Deleted or locked-out members can reach support. */
export async function POST(request: Request) {
  try {
    await consumeRateLimit(
      `public:support:${clientIp(request)}`,
      5,
      PUBLIC_WINDOW_MS
    )
    const data = supportRequestSchema.parse(await request.json())
    await prisma.supportRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: emptyToNull(data.phone),
        topic: data.topic,
        message: data.message,
      },
    })
    return jsonOk(
      {
        message: "We received your request. The church office will follow up.",
      },
      201
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export function GET() {
  return jsonError("Method not allowed", 405)
}
