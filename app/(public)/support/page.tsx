import { SupportForm } from "@/components/support/support-form"
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb"
import { APP_VERSION } from "@/lib/app-version"
import type { SupportTopic } from "@/lib/db/enums"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Support",
}

const TOPICS = new Set<SupportTopic>([
  "ACCOUNT_DELETED",
  "SIGN_IN",
  "PASSWORD",
  "PROFILE",
  "OTHER",
])

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; email?: string; topic?: string }>
}) {
  const params = await searchParams
  const deletedAccount = params.reason === "deleted"
  const topic = TOPICS.has(params.topic as SupportTopic)
    ? (params.topic as SupportTopic)
    : deletedAccount
      ? "ACCOUNT_DELETED"
      : undefined

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-6 w-full max-w-2xl">
        <PageBreadcrumb items={[{ label: "Support" }]} />
      </div>
      <SupportForm
        defaultEmail={params.email}
        defaultTopic={topic}
        deletedAccount={deletedAccount}
      />
      <p className="mt-8 text-xs text-muted-foreground">
        CTC Hub v{APP_VERSION}
      </p>
    </div>
  )
}
