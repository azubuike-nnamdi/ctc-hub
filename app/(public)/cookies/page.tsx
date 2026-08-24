import Link from "next/link"

import { CookiePreferencesLink } from "@/components/cookies/cookie-consent"
import { PublicLegalFooter } from "@/components/cookies/public-legal-footer"
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb"
import {
  CONSENT_CATEGORIES,
  COOKIE_POLICY_EFFECTIVE,
} from "@/lib/cookies/consent"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy",
}

export default function CookiePolicyPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-6 w-full max-w-2xl">
        <PageBreadcrumb items={[{ label: "Cookie Policy" }]} />
      </div>
      <article className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-medium">Cookie Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Effective Date: {COOKIE_POLICY_EFFECTIVE}
        </p>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Introduction</h2>
          <p className="text-sm text-muted-foreground">
            At Christ Treasure Centre (“we”, “us” or “our”), we are committed to
            maintaining your trust and ensuring transparency in how we use
            cookies on CTC Hub. This Cookie Policy explains what cookies are,
            types of cookies we use, how and why we use them, and your options
            regarding their management.
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">What Are Cookies?</h2>
          <p className="text-sm text-muted-foreground">
            Cookies are small text files stored on your device (smartphone or
            PC) when you visit a website. These files contain information that
            helps enhance your browsing experience by remembering your
            preferences, enabling sign-in, and providing the services you ask
            for.
          </p>
        </section>

        <section className="mt-6 grid gap-3">
          <h2 className="font-medium">Types of Cookies We Use</h2>
          <p className="text-sm text-muted-foreground">
            We use both Session Cookies (which expire once you close your web
            browser) and Persistent Cookies (which stay on your device until you
            delete them or we delete them after a specific period).
          </p>
          <p className="text-sm text-muted-foreground">
            We have grouped our cookies into the following categories, to make
            it easier for you to understand why we need them:
          </p>
          <ol className="grid list-decimal gap-3 pl-5">
            {CONSENT_CATEGORIES.map((category) => (
              <li key={category.id} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {category.title}:
                </span>{" "}
                {category.body}
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground">
            If you follow a link from CTC Hub to another website, the owner of
            that website will have their own privacy and cookie policies. Please
            check the relevant third-party website for more information. We are
            not responsible for cookies or incidents that occur as a result of
            your accessing third-party links.
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">How and Why We Use Cookies</h2>
          <p className="text-sm text-muted-foreground">
            Session and security cookies hold a random reference so we can
            recognise a signed-in session. They cannot read other files on your
            computer or mobile device.
          </p>
          <p className="text-sm text-muted-foreground">
            We may use the information we obtain from your use of our cookies
            for the following purposes:
          </p>
          <ul className="grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              the administration of CTC Hub (such as to ensure safe and secure
              access);
            </li>
            <li>
              to remember your preferences and provide a seamless experience;
            </li>
            <li>
              to keep the login, campus, and password-reset flows working.
            </li>
          </ul>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Third-party cookies</h2>
          <p className="text-sm text-muted-foreground">
            CTC Hub does not currently embed Google Analytics, advertising
            pixels, or social plugins that set third-party cookies. Invite and
            password emails are sent through Mailtrap; that is email delivery,
            not a cookie on this site. If we add third-party cookies later, we
            will update this policy and ask for a new preference.
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Your Cookie Preferences</h2>
          <p className="text-sm text-muted-foreground">
            You can manage your cookie preferences on this site. Use{" "}
            <CookiePreferencesLink /> to accept cookies, disable optional
            cookies, or read the categories again. Most web browsers also allow
            you to:
          </p>
          <ul className="grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground">
            <li>Enable or disable cookies.</li>
            <li>Delete cookies stored on your device.</li>
            <li>
              Adjust browser settings to notify you before accepting cookies.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Please note that disabling necessary cookies will stop you from
            staying signed in. Disabling optional cookies may change layout
            preferences such as the sidebar.
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Complaints</h2>
          <p className="text-sm text-muted-foreground">
            For cookie-related enquiries and complaints, please contact the
            church office through our{" "}
            <Link
              href="/support"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              support form
            </Link>
            . You have a right to lodge a complaint directly with the Nigeria
            Data Protection Commission (NDPC).
          </p>
        </section>

        <section className="mt-6 grid gap-2">
          <h2 className="font-medium">Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground">
            We may update this Cookie Policy periodically to reflect changes in
            our practices or applicable laws. Kindly review this Cookie Policy
            from time to time to ensure that you have up-to-date information.
          </p>
          <p className="text-sm text-muted-foreground">
            The effective date at the top of this page indicates when this
            Cookie Policy was last revised.
          </p>
        </section>
      </article>
      <PublicLegalFooter />
    </div>
  )
}
