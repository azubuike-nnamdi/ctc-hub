import { DepartmentDetail } from "@/components/departments/department-detail"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Department",
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requirePageAccess("members:read")
  const { id } = await params
  return <DepartmentDetail id={id} role={user.role} />
}
