"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import type { Event } from "@/lib/db/types"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"
import { eventSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof eventSchema>

function toLocalInput(value: Date) {
  const offset = value.getTimezoneOffset()
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

export function EventsView({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: "1", pageSize: "24" })
    if (q) search.set("q", q)
    if (status !== "ALL") search.set("status", status)
    return search.toString()
  }, [q, status])

  const query = useQuery({
    queryKey: ["events", params],
    queryFn: () =>
      api<{ items: Array<Event & { createdBy: { firstName: string; lastName: string } }> }>(
        `/api/events?${params}`
      ),
  })

  const form = useForm<Values>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startsAt: "",
      endsAt: "",
      venue: "",
      status: "SCHEDULED",
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: Values) => {
      if (editing) {
        return api(`/api/events/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        })
      }
      return api("/api/events", { method: "POST", body: JSON.stringify(values) })
    },
    onSuccess: () => {
      toast.success(editing ? "Event updated." : "Event created.")
      queryClient.invalidateQueries({ queryKey: ["events"] })
      setOpen(false)
      setEditing(null)
      form.reset()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      }),
    onSuccess: () => {
      toast.success("Event cancelled.")
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Event deleted.")
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreate() {
    setEditing(null)
    form.reset()
    setOpen(true)
  }

  function openEdit(event: Event) {
    setEditing(event)
    form.reset({
      title: event.title,
      description: event.description ?? "",
      startsAt: toLocalInput(new Date(event.startsAt)),
      endsAt: toLocalInput(new Date(event.endsAt)),
      venue: event.venue,
      status: event.status,
      capacity: event.capacity,
    })
    setOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Event Tracking"
        description="Manage church gatherings for this branch."
        action={
          can(role, "events:write")
            ? { label: "Create Event", onClick: openCreate }
            : undefined
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search events"
          className="max-w-xs"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          value={status}
          onValueChange={(value) => value && setStatus(value)}
          items={{
            ALL: "All statuses",
            DRAFT: "Draft",
            SCHEDULED: "Scheduled",
            CANCELLED: "Cancelled",
            COMPLETED: "Completed",
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {query.data?.items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.items.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{event.title}</CardTitle>
                  <StatusBadge value={event.status} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <p>{format(new Date(event.startsAt), "EEE d MMM yyyy, HH:mm")}</p>
                <p>{event.venue}</p>
                <p>
                  Created by {event.createdBy.firstName} {event.createdBy.lastName}
                </p>
                {can(role, "events:write") ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(event)}>
                      Edit
                    </Button>
                    {event.status !== "CANCELLED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelMutation.mutate(event.id)}
                        isLoading={
                          cancelMutation.isPending &&
                          cancelMutation.variables === event.id
                        }
                        isLoadingText="Cancelling..."
                      >
                        Cancel
                      </Button>
                    ) : null}
                    {event.status === "DRAFT" || event.status === "CANCELLED" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(event.id)}
                        isLoading={
                          deleteMutation.isPending &&
                          deleteMutation.variables === event.id
                        }
                        isLoadingText="Deleting..."
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No events"
          description="Create Sunday service, Treasure Hunt, or a prayer meeting."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "Create event"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={form.handleSubmit((values) => saveMutation.mutateAsync(values))}
          >
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input
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
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Starts</Label>
                <Input
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
                <Label>Ends</Label>
                <Input
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
              <Label>Venue</Label>
              <Input
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
              <Label>Capacity (optional)</Label>
              <Input
                type="number"
                onChange={(event) =>
                  form.setValue(
                    "capacity",
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saveMutation.isPending} isLoadingText="Saving...">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
