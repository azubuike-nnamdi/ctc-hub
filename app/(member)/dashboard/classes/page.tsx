import { MemberClassesView } from "@/components/member/classes-view"
import { requireMemberUser } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Classes",
}

export default async function MemberClassesPage() {
  await requireMemberUser()
  return <MemberClassesView />
}
