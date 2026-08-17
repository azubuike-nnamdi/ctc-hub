import { MemberSettings } from "@/components/member/member-settings"
import { requireMemberUser } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function MemberSettingsPage() {
  await requireMemberUser()
  return <MemberSettings />
}
