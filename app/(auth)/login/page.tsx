import { LoginForm } from "@/components/auth/login-form"
import { PublicLegalFooter } from "@/components/cookies/public-legal-footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <LoginForm />
      <div className="absolute bottom-6">
        <PublicLegalFooter className="mt-0" />
      </div>
    </div>
  )
}
