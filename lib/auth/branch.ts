import { cookies } from "next/headers"
import type { Role } from "@/lib/auth/rbac"

export const BRANCH_COOKIE = "ctc-branch-id"

export async function resolveBranchId(user: {
  role: Role
  branchId: string | null
}) {
  if (user.role === "SUPER_ADMIN") {
    const store = await cookies()
    return store.get(BRANCH_COOKIE)?.value ?? user.branchId
  }

  return user.branchId
}
