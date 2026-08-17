import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { resolveBranchId } from "@/lib/auth/branch"
import { assertCan, type Action } from "@/lib/auth/rbac"

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

export async function requireBranchContext(action?: Action) {
  const user = await requireApiUser()
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

export async function requirePageAccess(action: Action) {
  const user = await requireUser()
  if (action) {
    try {
      assertCan(user.role, action)
    } catch {
      redirect("/dashboard")
    }
  }
  const branchId = await resolveBranchId(user)
  return { user, branchId }
}
