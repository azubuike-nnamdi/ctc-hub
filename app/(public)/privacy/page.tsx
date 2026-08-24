import Link from "next/link"

import { CookiePreferencesLink } from "@/components/cookies/cookie-consent"
import { PublicLegalFooter } from "@/components/cookies/public-legal-footer"
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-6 w-full max-w-2xl">
        <PageBreadcrumb items={[{ label: "Privacy Policy" }]} />
      </div>
      <article className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-medium">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Christ Treasure Centre uses CTC Hub to look after members, first
          timers, and campus life at Treasure City. We take your privacy
          seriously and only process personal information following the Nigeria
          Data Protection Act, 2023 and any applicable regulations.
        </p>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Church records and email</h2>
          <p className="text-sm text-muted-foreground">
            CTC Hub stores member, first-timer, soul-win, and support details in
            our database so the church can follow up and run campus life. Invite
            and password emails are sent through Mailtrap. This is not stored in
            cookies.
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Cookies</h2>
          <p className="text-sm text-muted-foreground">
            We use cookies to keep you signed in and, if you allow them, to
            remember staff layout choices. Read the{" "}
            <Link
              href="/cookies"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Cookie Policy
            </Link>{" "}
            for types of cookies, how to accept or disable optional cookies, and
            how to change your <CookiePreferencesLink />.
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Complaints</h2>
          <p className="text-sm text-muted-foreground">
            For privacy enquiries, contact the church office through our{" "}
            <Link
              href="/support"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              support form
            </Link>
            . You may also lodge a complaint with the Nigeria Data Protection
            Commission (NDPC).
          </p>
        </section>
      </article>
      <PublicLegalFooter />
    </div>
  )
}
