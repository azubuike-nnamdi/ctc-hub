import { SoulTrackerDetail } from "@/components/soul-tracker/soul-tracker-detail"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Soul",
}

export default async function SoulTrackerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requirePageAccess("soul-tracker:read")
  const { id } = await params
  return <SoulTrackerDetail id={id} role={user.role} />
}
