import { MemberFollowUpView } from "@/components/member/follow-up-view"
import { memberCanFollowUp } from "@/lib/departments/follow-up"
import { requireMemberUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Follow-up",
}

export default async function MemberFollowUpPage() {
  const user = await requireMemberUser()
  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!member || !(await memberCanFollowUp(member.id))) {
    redirect("/dashboard")
  }

  return <MemberFollowUpView />
}
