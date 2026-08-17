import {
  emptyToNull,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api/errors"
import { prisma } from "@/lib/db/prisma"
import { supportRequestSchema } from "@/lib/validation/schemas"

/** Intentionally unauthenticated. Deleted or locked-out members can reach support. */
export async function POST(request: Request) {
  try {
    const data = supportRequestSchema.parse(await request.json())
    const created = await prisma.supportRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: emptyToNull(data.phone),
        topic: data.topic,
        message: data.message,
      },
      select: { id: true },
    })
    return jsonOk(
      {
        message: "We received your request. The church office will follow up.",
        id: created.id,
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
