import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { prisma } from "@/lib/db/prisma"
import { inviteMember } from "@/lib/members/create"
import { memberSignupSchema } from "@/lib/validation/schemas"

/** Intentionally unauthenticated. New members create an account here. */
export async function POST(request: Request) {
  try {
    const data = memberSignupSchema.parse(await request.json())
    const branch = await prisma.branch.findUnique({
      where: { slug: data.branchSlug },
      select: { id: true },
    })
    if (!branch) {
      return jsonError("Campus not found.", 404)
    }

    const member = await inviteMember({
      branchId: branch.id,
      data,
    })

    return jsonOk(
      {
        message: "Check your email for your temporary password.",
        id: member.id,
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
