import { compare, hash } from "bcryptjs"
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireApiUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { passwordResetSchema } from "@/lib/validation/schemas"

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireApiUser()
    const data = passwordResetSchema.parse(await request.json())

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    })
    if (!user) {
      return jsonError("User not found.", 404)
    }

    const valid = await compare(data.currentPassword, user.passwordHash)
    if (!valid) {
      return jsonError("Current password is incorrect.", 400)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(data.newPassword, 12),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    })

    return jsonOk({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
