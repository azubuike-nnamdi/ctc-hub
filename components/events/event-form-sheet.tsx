"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { eventSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof eventSchema>

const emptyValues: Values = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  venue: "",
  status: "SCHEDULED",
  capacity: null,
}

export function EventFormSheet({
  open,
  onOpenChange,
  title,
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  defaultValues?: Partial<Values>
  onSubmit: (values: Values) => Promise<void>
  isSubmitting: boolean
}) {
  const form = useForm<Values>({
    resolver: zodResolver(eventSchema),
    values: {
      title: defaultValues?.title ?? emptyValues.title,
      description: defaultValues?.description ?? emptyValues.description,
      startsAt: defaultValues?.startsAt ?? emptyValues.startsAt,
      endsAt: defaultValues?.endsAt ?? emptyValues.endsAt,
      venue: defaultValues?.venue ?? emptyValues.venue,
      status: defaultValues?.status ?? emptyValues.status,
      capacity: defaultValues?.capacity ?? emptyValues.capacity,
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Service, Treasure Hunt, or another church gathering.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
            <div className="grid gap-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                aria-invalid={Boolean(form.formState.errors.title)}
                {...form.register("title")}
              />
              {form.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                {...form.register("description")}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="event-starts">Starts</Label>
                <Input
                  id="event-starts"
                  type="datetime-local"
                  aria-invalid={Boolean(form.formState.errors.startsAt)}
                  {...form.register("startsAt")}
                />
                {form.formState.errors.startsAt ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.startsAt.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="event-ends">Ends</Label>
                <Input
                  id="event-ends"
                  type="datetime-local"
                  aria-invalid={Boolean(form.formState.errors.endsAt)}
                  {...form.register("endsAt")}
                />
                {form.formState.errors.endsAt ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.endsAt.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-venue">Venue</Label>
              <Input
                id="event-venue"
                aria-invalid={Boolean(form.formState.errors.venue)}
                {...form.register("venue")}
              />
              {form.formState.errors.venue ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.venue.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="event-capacity">Capacity (optional)</Label>
              <Input
                id="event-capacity"
                type="number"
                value={form.watch("capacity") ?? ""}
                onChange={(event) =>
                  form.setValue(
                    "capacity",
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="brand"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              isLoadingText="Saving..."
            >
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
