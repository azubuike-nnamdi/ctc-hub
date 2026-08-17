"use client"

import { useMutation } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import { z } from "zod"

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
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import type { SupportTopic } from "@/lib/db/enums"
import {
  SUPPORT_TOPIC_HELP,
  SUPPORT_TOPIC_LABELS,
  SUPPORT_TOPICS,
} from "@/lib/utils/labels"
import { supportRequestSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof supportRequestSchema>

export function SupportForm({
  defaultEmail,
  defaultTopic,
  deletedAccount,
}: {
  defaultEmail?: string
  defaultTopic?: SupportTopic
  deletedAccount?: boolean
}) {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(supportRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: defaultEmail ?? "",
      phone: "",
      topic: defaultTopic ?? (deletedAccount ? "ACCOUNT_DELETED" : "SIGN_IN"),
      message: deletedAccount
        ? "My member account was deleted and I need it restored."
        : "",
    },
  })

  const topic = form.watch("topic")

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      api("/api/public/support", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => setSubmitted(true),
    onError: (error: Error) => toast.error(error.message),
  })

  if (submitted) {
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
          <CardTitle className="text-xl">We have your request</CardTitle>
          <CardDescription>
            The church office will follow up. You can also sign in again after
            your account is restored.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-2 pb-6">
          <Button variant="outline" render={<Link href="/login" />}>
            Back to sign in
          </Button>
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
        <CardTitle className="text-xl">Support</CardTitle>
        <CardDescription>
          {deletedAccount
            ? "This member account has been deleted. Tell us what you need and the church office will help."
            : "Choose the help you need and we will follow up."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-2">
            <Label>What do you need help with?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUPPORT_TOPICS.map((option) => {
                const selected = topic === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => form.setValue("topic", option)}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {SUPPORT_TOPIC_LABELS[option]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {SUPPORT_TOPIC_HELP[option]}
                    </p>
                  </button>
                )
              })}
            </div>
            {form.formState.errors.topic ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.topic.message}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>First name</Label>
              <Input
                aria-invalid={Boolean(form.formState.errors.firstName)}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label>Last name</Label>
              <Input
                aria-invalid={Boolean(form.formState.errors.lastName)}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                type="email"
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
              <Label>Phone</Label>
              <Input {...form.register("phone")} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Message</Label>
            <Textarea
              rows={4}
              aria-invalid={Boolean(form.formState.errors.message)}
              {...form.register("message")}
            />
            {form.formState.errors.message ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.message.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            isLoading={mutation.isPending}
            isLoadingText="Sending..."
          >
            Send request
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Remembered your details?{" "}
            <Link href="/login" className="font-medium text-primary">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
