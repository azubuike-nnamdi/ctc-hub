import { ClassDetail } from "@/components/classes/class-detail"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Class",
}

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requirePageAccess("soul-tracker:read")
  const { id } = await params
  return <ClassDetail id={id} role={user.role} />
}
