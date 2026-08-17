import { cookies } from "next/headers"

import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { auth } from "@/lib/auth/auth"
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  serializeConsentCookie,
} from "@/lib/cookies/consent"
import { prisma } from "@/lib/db/prisma"
import { cookieConsentSchema } from "@/lib/validation/schemas"

function userAgent(request: Request) {
  const value = request.headers.get("user-agent")?.trim()
  if (!value) {
    return null
  }
  return value.slice(0, 512)
}

/** Intentionally public. Anonymous visitors can accept the notice. */
export async function POST(request: Request) {
  try {
    const data = cookieConsentSchema.parse(await request.json())
    const session = await auth()
    const acceptedAt = new Date()

    const created = await prisma.cookieConsentLog.create({
      data: {
        version: data.version,
        acceptedAt,
        userId: session?.user?.id ?? null,
        userAgent: userAgent(request),
      },
      select: { id: true, acceptedAt: true },
    })

    const store = await cookies()
    store.set(
      CONSENT_COOKIE,
      serializeConsentCookie({
        version: data.version,
        id: created.id,
        at: created.acceptedAt.toISOString(),
      }),
      {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: CONSENT_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
      }
    )

    return jsonOk({ id: created.id }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

export function GET() {
  return jsonError("Method not allowed", 405)
}
