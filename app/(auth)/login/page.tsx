import { LoginForm } from "@/components/auth/login-form"
import { APP_VERSION } from "@/lib/app-version"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <LoginForm />
      <p className="absolute bottom-6 text-xs text-muted-foreground">
        CTC Hub v{APP_VERSION}
      </p>
    </div>
  )
}
