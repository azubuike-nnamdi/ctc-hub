import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset password",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <ResetPasswordForm />
    </div>
  )
}
