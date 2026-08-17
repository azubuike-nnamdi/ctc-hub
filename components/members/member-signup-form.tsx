"use client"

import { useMutation } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"

import {
  emptyMemberValues,
  MemberFormFields,
  type MemberFormValues,
} from "@/components/members/member-form-fields"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { memberSchema } from "@/lib/validation/schemas"

export function MemberSignupForm({
  branchName,
  branchSlug,
}: {
  branchName: string
  branchSlug: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: emptyMemberValues,
  })

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) =>
      api("/api/public/signup", {
        method: "POST",
        body: JSON.stringify({ ...values, branchSlug }),
      }),
    onSuccess: () => {
      setSubmitted(true)
      form.reset(emptyMemberValues)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="items-center text-center">
          <Image
            src="/img/ctc-logo.png"
            alt=""
            width={150}
            height={150}
            className="mx-auto"
            unoptimized
          />
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We sent a temporary password for {branchName}. Sign in, then reset
            it before you continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button render={<Link href="/login" />}>Sign in</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="items-center text-center">
        <Image
          src="/img/ctc-logo.png"
          alt=""
          width={56}
          height={56}
          className="size-14"
          unoptimized
        />
        <CardTitle className="text-xl">Member sign up</CardTitle>
        <CardDescription>
          Join CTC Hub at {branchName}. You will receive a temporary password by
          email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <MemberFormFields form={form} />
          <Button
            type="submit"
            className="mt-2"
            isLoading={mutation.isPending}
            isLoadingText="Creating account..."
          >
            Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
