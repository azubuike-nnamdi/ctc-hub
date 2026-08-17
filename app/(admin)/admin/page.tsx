import { DashboardView } from "@/components/dashboard/dashboard-view"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const { user } = await requirePageAccess("settings:profile")
  return <DashboardView firstName={user.firstName} role={user.role} />
}
