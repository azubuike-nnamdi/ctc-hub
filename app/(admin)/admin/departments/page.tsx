import { DepartmentsView } from "@/components/departments/departments-view"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Departments",
}

export default async function DepartmentsPage() {
  const { user } = await requirePageAccess("members:read")
  return <DepartmentsView role={user.role} />
}
