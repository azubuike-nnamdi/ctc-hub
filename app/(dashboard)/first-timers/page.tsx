import { FirstTimersView } from "@/components/first-timers/first-timers-view"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "First Timers",
}

export default async function FirstTimersPage() {
  const { user } = await requirePageAccess("first-timers:read")
  return <FirstTimersView role={user.role} />
}
