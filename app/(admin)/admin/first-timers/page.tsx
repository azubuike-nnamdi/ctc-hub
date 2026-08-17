import { FirstTimersView } from "@/components/first-timers/first-timers-view"
import { requirePageAccess } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "First Timers",
}

export default async function FirstTimersPage() {
  const { user, branchId } = await requirePageAccess("first-timers:read")
  const branch = branchId
    ? await prisma.branch.findUnique({
        where: { id: branchId },
        select: { slug: true },
      })
    : null

  return (
    <FirstTimersView
      role={user.role}
      publicFormPath={branch ? `/register/${branch.slug}` : undefined}
    />
  )
}
