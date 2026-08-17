import { MemberDashboard } from "@/components/member/member-dashboard"
import { requireMemberUser } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function MemberDashboardPage() {
  const user = await requireMemberUser()
  return <MemberDashboard firstName={user.firstName} />
}
