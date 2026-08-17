import Link from "next/link"

import { CookiePreferencesLink } from "@/components/cookies/cookie-consent"
import { APP_VERSION } from "@/lib/app-version"
import { cn } from "@/lib/utils"

export function PublicLegalFooter({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "mt-8 text-center text-xs text-muted-foreground",
        className
      )}
    >
      CTC Hub v{APP_VERSION}
      {" · "}
      <Link
        href="/privacy"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        Privacy
      </Link>
      {" · "}
      <CookiePreferencesLink />
    </p>
  )
}
