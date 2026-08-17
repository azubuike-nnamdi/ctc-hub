import { CookiePreferencesLink } from "@/components/cookies/cookie-consent"
import { CONSENT_CATEGORIES } from "@/lib/cookies/consent"
import { PublicLegalFooter } from "@/components/cookies/public-legal-footer"
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy",
}

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-6 w-full max-w-2xl">
        <PageBreadcrumb items={[{ label: "Privacy" }]} />
      </div>
      <article className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-medium">
          Privacy and cookies
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Christ Treasure Centre uses CTC Hub to look after members, first
          timers, and campus life at Treasure City. This page explains the
          cookies we set and the records we keep. It is a plain notice, not a
          full legal policy.
        </p>
        <div className="mt-6 grid gap-5">
          {CONSENT_CATEGORIES.map((category) => (
            <section key={category.id} className="grid gap-1.5">
              <h2 className="font-medium">{category.title}</h2>
              <p className="text-sm text-muted-foreground">{category.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          When you accept the notice we save that choice in this browser and in
          a church record (notice version and time; your account if you are
          signed in). You can open <CookiePreferencesLink /> anytime.
        </p>
      </article>
      <PublicLegalFooter />
    </div>
  )
}
