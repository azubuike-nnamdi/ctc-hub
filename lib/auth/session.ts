import { redirect } from "next/navigation"
import type { Session } from "next-auth"

import { auth } from "@/lib/auth/auth"
import { resolveBranchId } from "@/lib/auth/branch"
import {
  assertCan,
  homePathForRole,
  isMemberRole,
  type Action,
} from "@/lib/auth/rbac"
import { prisma } from "@/lib/db/prisma"

export type AuthUser = Session["user"]

function forbidden(): never {
  const error = new Error("Forbidden")
  error.name = "ForbiddenError"
  throw error
}

function unauthorized(): never {
  const error = new Error("Unauthorized")
  error.name = "UnauthorizedError"
  throw error
}

function passwordResetRequired(): never {
  const error = new Error("Password reset required")
  error.name = "PasswordResetRequiredError"
  throw error
}

function toAuthUser(user: {
  id: string
  email: string
  role: AuthUser["role"]
  branchId: string | null
  firstName: string
  lastName: string
  mustChangePassword: boolean
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    branchId: user.branchId,
    firstName: user.firstName,
    lastName: user.lastName,
    mustChangePassword: user.mustChangePassword,
  }
}

async function loadLiveUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { member: { select: { isDeleted: true } } },
  })
}

function isUsableAccount(
  user: NonNullable<Awaited<ReturnType<typeof loadLiveUser>>>
) {
  return user.isActive && !user.member?.isDeleted
}

async function liveUserFromToken() {
  const session = await auth()
  if (!session?.user?.id) {
    return { session: null, user: null }
  }

  const user = await loadLiveUser(session.user.id)
  if (!user || !isUsableAccount(user)) {
    return { session, user: null }
  }

  return { session, user }
}

export async function requireUser() {
  const { session, user } = await liveUserFromToken()
  if (!session?.user?.id) {
    redirect("/login")
  }
  if (!user) {
    redirect("/api/auth/logout")
  }
  if (
    session.user.role !== user.role ||
    Boolean(session.user.mustChangePassword) !== user.mustChangePassword
  ) {
    redirect(
      `/api/auth/refresh?next=${encodeURIComponent(homePathForRole(user.role))}`
    )
  }
  if (user.mustChangePassword) {
    redirect("/reset-password")
  }
  return toAuthUser(user)
}

export async function requireApiUser(options?: {
  allowMustChangePassword?: boolean
}) {
  const { user } = await liveUserFromToken()
  if (!user) {
    unauthorized()
  }
  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    passwordResetRequired()
  }
  return toAuthUser(user)
}

export async function requireStaffUser() {
  const user = await requireUser()
  if (isMemberRole(user.role)) {
    redirect("/dashboard")
  }
  return user
}

export async function requireMemberUser() {
  const user = await requireUser()
  if (!isMemberRole(user.role)) {
    redirect("/admin")
  }
  return user
}

export async function requireBranchContext(action?: Action) {
  const user = await requireApiUser()
  if (isMemberRole(user.role)) {
    forbidden()
  }
  if (action) {
    assertCan(user.role, action)
  }

  const branchId = await resolveBranchId(user)
  if (!branchId) {
    const error = new Error("Select a branch to continue.")
    error.name = "ForbiddenError"
    throw error
  }

  return { user, branchId }
}

export async function requireMemberContext() {
  const user = await requireApiUser()
  if (!isMemberRole(user.role)) {
    forbidden()
  }

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
  })
  if (!member || member.isDeleted || member.status !== "ACTIVE") {
    forbidden()
  }

  return { user, member, branchId: member.branchId }
}

export async function requirePageAccess(action: Action) {
  const user = await requireStaffUser()
  if (action) {
    try {
      assertCan(user.role, action)
    } catch {
      redirect(homePathForRole(user.role))
    }
  }
  const branchId = await resolveBranchId(user)
  return { user, branchId }
}
