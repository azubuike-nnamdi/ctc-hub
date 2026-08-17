import { MembersView } from "@/components/members/members-view"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Members",
}

export default async function MembersPage() {
  const { user } = await requirePageAccess("members:read")
  return <MembersView role={user.role} />
}
