"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { signOut } from "next-auth/react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api/client"
import { passwordResetSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof passwordResetSchema>

export function ResetPasswordForm() {
  const form = useForm<Values>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: Values) {
    try {
      await api("/api/users/password", {
        method: "PATCH",
        body: JSON.stringify(values),
      })
      toast.success("Password updated. Sign in with your new password.")
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.")
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader className="flex flex-col items-center text-center">
        <Image
          src="/img/ctc-logo.png"
          alt="Christ Treasure Centre"
          width={100}
          height={100}
          unoptimized
        />
        <CardTitle className="text-3xl">Reset your password</CardTitle>
        <CardDescription>
          Use the temporary password from your email, then choose a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-1.5">
            <Label htmlFor="currentPassword">Temporary password</Label>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.currentPassword)}
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.newPassword)}
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.confirmPassword)}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            className="mt-2 h-12 w-full text-base"
            isLoading={form.formState.isSubmitting}
            isLoadingText="Saving..."
          >
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
