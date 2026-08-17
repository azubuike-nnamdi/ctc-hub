import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { resolveBranchId } from "@/lib/auth/branch"
import {
  assertCan,
  homePathForRole,
  isMemberRole,
  type Action,
} from "@/lib/auth/rbac"
import { prisma } from "@/lib/db/prisma"

function forbidden(): never {
  const error = new Error("Forbidden")
  error.name = "ForbiddenError"
  throw error
}

export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  return session.user
}

export async function requireApiUser() {
  const session = await auth()
  if (!session?.user?.id) {
    const error = new Error("Unauthorized")
    error.name = "UnauthorizedError"
    throw error
  }
  return session.user
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

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    select: { isDeleted: true },
  })
  if (member?.isDeleted) {
    redirect("/support?reason=deleted")
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
