"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { getSession, signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema } from "@/lib/validation/schemas"
import { homePathForRole } from "@/lib/auth/rbac"
import { CookiePreferencesLink } from "@/components/cookies/cookie-consent"

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      const code = "code" in result ? String(result.code ?? "") : ""
      if (code === "deleted_account" || result.error === "deleted_account") {
        router.push(
          `/support?reason=deleted&email=${encodeURIComponent(values.email)}`
        )
        return
      }
      toast.error(
        result.error === "CredentialsSignin"
          ? "Invalid email or password."
          : "Could not sign in. Check that the database is running and restart the app."
      )
      return
    }

    const session = await getSession()
    const role = session?.user?.role
    router.push(role ? homePathForRole(role) : "/login")
    router.refresh()
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
        <CardTitle className="text-3xl">Welcome back</CardTitle>
        <CardDescription>Please enter your details to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@church.org"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            className="mt-2 h-12 w-full text-base"
            isLoading={form.formState.isSubmitting}
            isLoadingText="Signing in..."
          >
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New member?{" "}
            <Link href="/signup" className="font-medium text-primary">
              Sign up
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
            {" · "}
            <CookiePreferencesLink />
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
