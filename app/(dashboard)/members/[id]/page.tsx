import { MemberProfile } from "@/components/members/member-profile"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Member",
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requirePageAccess("members:read")
  const { id } = await params
  return <MemberProfile id={id} role={user.role} />
}
