import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BreadcrumbLabelProvider } from "@/components/layout/breadcrumb-label-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { prisma } from "@/lib/db/prisma"
import { requireStaffUser } from "@/lib/auth/session"
import { resolveBranchId } from "@/lib/auth/branch"

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireStaffUser()
  const branchId = await resolveBranchId(user)
  const branches =
    user.role === "SUPER_ADMIN"
      ? await prisma.branch.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : []

  return (
    <BreadcrumbLabelProvider>
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
    </BreadcrumbLabelProvider>
  )
}
