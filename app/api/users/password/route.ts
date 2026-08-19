import { compare, hash } from "bcryptjs"
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { LOGIN_WINDOW_MS } from "@/lib/auth/constants"
import { consumeRateLimit } from "@/lib/auth/rate-limit"
import { requireApiUser } from "@/lib/auth/session"
import { revokeRefreshTokens } from "@/lib/auth/tokens"
import { prisma } from "@/lib/db/prisma"
import { passwordResetSchema } from "@/lib/validation/schemas"

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireApiUser({
      allowMustChangePassword: true,
    })
    await consumeRateLimit(`password:${sessionUser.id}`, 5, LOGIN_WINDOW_MS)
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
    await revokeRefreshTokens(user.id)

    return jsonOk({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
