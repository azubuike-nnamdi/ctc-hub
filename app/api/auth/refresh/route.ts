import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { jsonError, jsonOk } from "@/lib/api/errors"
import { REFRESH_COOKIE } from "@/lib/auth/constants"
import { safeNextPath } from "@/lib/auth/cookies"
import { rotateRefreshToken } from "@/lib/auth/tokens"

export const runtime = "nodejs"

async function refreshSession(request: Request) {
  const store = await cookies()
  const raw = store.get(REFRESH_COOKIE)?.value
  if (!raw) {
    return null
  }

  return rotateRefreshToken(raw, request)
}

export async function GET(request: Request) {
  const next = safeNextPath(new URL(request.url).searchParams.get("next"))
  const user = await refreshSession(request)
  if (!user) {
    const store = await cookies()
    store.delete(REFRESH_COOKIE)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}

export async function POST(request: Request) {
  const user = await refreshSession(request)
  if (!user) {
    const store = await cookies()
    store.delete(REFRESH_COOKIE)
    return jsonError("Authentication required", 401)
  }

  return jsonOk({ ok: true })
}
