import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { encode } from "next-auth/jwt"

import {
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "@/lib/auth/constants"
import { authCookieOptions, sessionCookieName } from "@/lib/auth/cookies"
import type { Role } from "@/lib/auth/rbac"
import { prisma } from "@/lib/db/prisma"

type LiveUser = {
  id: string
  email: string
  role: Role
  branchId: string | null
  firstName: string
  lastName: string
  mustChangePassword: boolean
}

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex")
}

function authSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not set")
  }
  return secret
}

export async function issueRefreshToken(userId: string) {
  const raw = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000)

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt,
    },
  })

  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      OR: [{ expiresAt: { lte: new Date() } }, { revokedAt: { not: null } }],
    },
  })

  const store = await cookies()
  store.set(REFRESH_COOKIE, raw, authCookieOptions(REFRESH_MAX_AGE))
}

export async function rotateRefreshToken(raw: string, request: Request) {
  const tokenHash = hashToken(raw)
  const now = new Date()

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: { member: { select: { isDeleted: true } } },
      },
    },
  })

  if (
    !existing ||
    existing.revokedAt ||
    existing.expiresAt <= now ||
    !existing.user.isActive ||
    existing.user.member?.isDeleted
  ) {
    return null
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: now },
  })

  const user = existing.user
  await issueRefreshToken(user.id)
  await issueAccessCookie(request, {
    id: user.id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    firstName: user.firstName,
    lastName: user.lastName,
    mustChangePassword: user.mustChangePassword,
  })

  return user
}

export async function issueAccessCookie(request: Request, user: LiveUser) {
  const cookieName = sessionCookieName(request)
  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      firstName: user.firstName,
      lastName: user.lastName,
      mustChangePassword: user.mustChangePassword,
    },
    secret: authSecret(),
    salt: cookieName,
    maxAge: ACCESS_MAX_AGE,
  })

  const store = await cookies()
  store.set(
    cookieName,
    token,
    authCookieOptions(ACCESS_MAX_AGE, cookieName.startsWith("__Secure-"))
  )
}

export async function revokeCurrentRefreshToken() {
  const store = await cookies()
  const raw = store.get(REFRESH_COOKIE)?.value
  if (!raw) {
    return
  }

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(raw), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function clearRefreshCookie() {
  const store = await cookies()
  store.delete(REFRESH_COOKIE)
}

export async function clearAuthCookies() {
  const store = await cookies()
  store.delete(REFRESH_COOKIE)
  store.delete("authjs.session-token")
  store.delete("__Secure-authjs.session-token")
}
