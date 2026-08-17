import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { auth } from "@/lib/auth/auth"
import { homePathForRole } from "@/lib/auth/rbac"

export const metadata: Metadata = {
  title: "CTC Hub",
}

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  redirect(homePathForRole(session.user.role))
}
