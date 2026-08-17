import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { prisma } from "@/lib/db/prisma"
import { requireUser } from "@/lib/auth/session"
import { resolveBranchId } from "@/lib/auth/branch"

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const branchId = await resolveBranchId(user)
  const branches =
    user.role === "SUPER_ADMIN"
      ? await prisma.branch.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : []

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset>
        <AppHeader
          user={user}
          branches={branches}
          currentBranchId={branchId}
        />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
