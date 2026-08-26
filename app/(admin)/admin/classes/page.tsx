import { ClassesView } from "@/components/classes/classes-view"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Classes",
}

export default async function AdminClassesPage() {
  const { user } = await requirePageAccess("soul-tracker:read")
  return <ClassesView role={user.role} />
}
