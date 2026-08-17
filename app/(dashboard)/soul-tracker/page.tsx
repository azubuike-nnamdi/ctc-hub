import { SoulTrackerList } from "@/components/soul-tracker/soul-tracker-list"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Soul Tracker",
}

export default async function SoulTrackerPage() {
  await requirePageAccess("soul-tracker:read")
  return <SoulTrackerList />
}
