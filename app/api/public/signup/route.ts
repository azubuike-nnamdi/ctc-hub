import {
  handleRouteError,
  jsonError,
  jsonOk,
  MemberInviteError,
} from "@/lib/api/errors"
import { PUBLIC_WINDOW_MS } from "@/lib/auth/constants"
import { clientIp, consumeRateLimit } from "@/lib/auth/rate-limit"
import { prisma } from "@/lib/db/prisma"
import { inviteMember } from "@/lib/members/create"
import { memberSignupSchema } from "@/lib/validation/schemas"

const SIGNUP_MESSAGE = "Check your email for your temporary password."

/** Intentionally unauthenticated. New members create an account here. */
export async function POST(request: Request) {
  try {
    await consumeRateLimit(
      `public:signup:${clientIp(request)}`,
      5,
      PUBLIC_WINDOW_MS
    )
    const data = memberSignupSchema.parse(await request.json())
    const branch = await prisma.branch.findUnique({
      where: { slug: data.branchSlug },
      select: { id: true },
    })
    if (!branch) {
      return jsonError("Campus not found.", 404)
    }

    await inviteMember({
      branchId: branch.id,
      data,
    })

    return jsonOk({ message: SIGNUP_MESSAGE }, 201)
  } catch (error) {
    if (error instanceof MemberInviteError && error.status === 409) {
      return jsonOk({ message: SIGNUP_MESSAGE }, 201)
    }
    if (error instanceof MemberInviteError) {
      return jsonError("Could not complete signup. Try again later.", 502)
    }
    return handleRouteError(error)
  }
}

export function GET() {
  return jsonError("Method not allowed", 405)
}
