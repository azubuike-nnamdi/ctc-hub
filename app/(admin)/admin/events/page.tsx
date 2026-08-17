import { EventsView } from "@/components/events/events-view"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events",
}

export default async function EventsPage() {
  const { user } = await requirePageAccess("events:read")
  return <EventsView role={user.role} />
}
