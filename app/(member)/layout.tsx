import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BreadcrumbLabelProvider } from "@/components/layout/breadcrumb-label-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { memberCanFollowUp } from "@/lib/departments/follow-up"
import { requireMemberUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export default async function MemberDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireMemberUser()
  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  const canFollowUp = member ? await memberCanFollowUp(member.id) : false

  return (
    <BreadcrumbLabelProvider>
      <SidebarProvider>
        <AppSidebar role={user.role} canFollowUp={canFollowUp} />
        <SidebarInset>
          <AppHeader
            user={user}
            branches={[]}
            currentBranchId={user.branchId}
          />
          <div className="min-w-0 flex-1 overflow-auto p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbLabelProvider>
  )
}
