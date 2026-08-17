import { LogSoulView } from "@/components/member/log-soul-view"
import { requireMemberUser } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log Soul",
}

export default async function LogSoulPage() {
  await requireMemberUser()
  return <LogSoulView />
}
