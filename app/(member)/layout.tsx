import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BreadcrumbLabelProvider } from "@/components/layout/breadcrumb-label-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireMemberUser } from "@/lib/auth/session"

export default async function MemberDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireMemberUser()

  return (
    <BreadcrumbLabelProvider>
      <SidebarProvider>
        <AppSidebar role={user.role} />
        <SidebarInset>
          <AppHeader
            user={user}
            branches={[]}
            currentBranchId={user.branchId}
          />
          <div className="flex-1 overflow-auto p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbLabelProvider>
  )
}
