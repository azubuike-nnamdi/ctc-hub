"use client"

import { useMutation } from "@tanstack/react-query"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"

import {
  emptyFirstTimerValues,
  FirstTimerFormFields,
  type FirstTimerVisitorValues,
} from "@/components/first-timers/first-timer-form-fields"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { firstTimerVisitorSchema } from "@/lib/validation/schemas"

export function PublicFirstTimerForm({
  branchName,
  branchSlug,
}: {
  branchName: string
  branchSlug: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<FirstTimerVisitorValues>({
    resolver: zodResolver(firstTimerVisitorSchema),
    defaultValues: emptyFirstTimerValues,
  })

  const mutation = useMutation({
    mutationFn: (values: FirstTimerVisitorValues) =>
      api("/api/public/first-timers", {
        method: "POST",
        body: JSON.stringify({ ...values, branchSlug }),
      }),
    onSuccess: () => {
      setSubmitted(true)
      form.reset(emptyFirstTimerValues)
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
            width={56}
            height={56}
            className="size-14"
            unoptimized
          />
          <CardTitle className="text-xl">Thank you for visiting</CardTitle>
          <CardDescription>
            We have received your details. Our follow-up team at {branchName}{" "}
            will be in touch.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button type="button" onClick={() => setSubmitted(false)}>
            Submit another response
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="items-center border-b text-center">
        <Image
          src="/img/ctc-logo.png"
          alt=""
          width={56}
          height={56}
          className="size-14"
          unoptimized
        />
        <CardTitle className="text-xl">Welcome to CTC</CardTitle>
        <CardDescription>
          We are glad you worshipped with us at {branchName}. Fill this form so
          we can stay in touch.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="grid gap-6"
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync(values)
          })}
        >
          <FirstTimerFormFields form={form} />
          <Button
            type="submit"
            className="w-full sm:w-auto sm:justify-self-end"
            isLoading={mutation.isPending}
            isLoadingText="Submitting..."
          >
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
