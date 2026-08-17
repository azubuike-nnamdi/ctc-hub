"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"

import { PageHeader } from "@/components/shared/page-header"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import { SOUL_WIN_EVENT_LABELS, SOUL_WIN_EVENT_TYPES } from "@/lib/utils/labels"
import { soulWinSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof soulWinSchema>

const emptyValues: Values = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  eventType: "PERSONAL",
}

export function LogSoulView() {
  const queryClient = useQueryClient()
  const form = useForm<Values>({
    resolver: zodResolver(soulWinSchema),
    defaultValues: emptyValues,
  })

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      api("/api/me/souls", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Soul logged.")
      form.reset(emptyValues)
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div>
      <PageHeader
        title="Log soul"
        description="Record someone you won through personal evangelism, GrowthNet, or Winsome."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>New soul</CardTitle>
          <CardDescription>
            These details stay on your dashboard stats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
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
                <Label>Phone number</Label>
                <Input
                  aria-invalid={Boolean(form.formState.errors.phone)}
                  {...form.register("phone")}
                />
                {form.formState.errors.phone ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label>Email address</Label>
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
            </div>
            <div className="grid gap-1.5">
              <Label>Event type</Label>
              <Select
                value={form.watch("eventType")}
                onValueChange={(value) => {
                  if (value) {
                    form.setValue("eventType", value as Values["eventType"])
                  }
                }}
                items={Object.fromEntries(
                  SOUL_WIN_EVENT_TYPES.map((type) => [
                    type,
                    SOUL_WIN_EVENT_LABELS[type],
                  ])
                )}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={Boolean(form.formState.errors.eventType)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUL_WIN_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {SOUL_WIN_EVENT_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.eventType ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.eventType.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="mt-2"
              isLoading={mutation.isPending}
              isLoadingText="Saving..."
            >
              Log soul
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
