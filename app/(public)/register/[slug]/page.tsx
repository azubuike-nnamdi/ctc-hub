import { PublicFirstTimerForm } from "@/components/first-timers/public-first-timer-form"
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb"
import { prisma } from "@/lib/db/prisma"
import { APP_VERSION } from "@/lib/app-version"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const branch = await prisma.branch.findUnique({
    where: { slug },
    select: { name: true },
  })
  return {
    title: branch ? `First Timer Form · ${branch.name}` : "First Timer Form",
    robots: { index: false, follow: false },
  }
}

export default async function PublicFirstTimerPage({ params }: Params) {
  const { slug } = await params
  const branch = await prisma.branch.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  })
  if (!branch) {
    notFound()
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-6 w-full max-w-2xl">
        <PageBreadcrumb
          items={[
            { label: "Register", href: "/register" },
            { label: branch.name },
          ]}
        />
      </div>
      <PublicFirstTimerForm branchName={branch.name} branchSlug={branch.slug} />
      <p className="mt-8 text-xs text-muted-foreground">
        CTC Hub v{APP_VERSION}
      </p>
    </div>
  )
}
