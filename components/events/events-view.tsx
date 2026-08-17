"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarDaysIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { Event } from "@/lib/db/types"

import { EventFormSheet } from "@/components/events/event-form-sheet"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { CardsSkeleton, QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"
import { eventSchema } from "@/lib/validation/schemas"
import { z } from "zod"

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
      api<{
        items: Array<
          Event & { createdBy: { firstName: string; lastName: string } }
        >
      }>(`/api/events?${params}`),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: Values) => {
      if (editing) {
        return api(`/api/events/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        })
      }
      return api("/api/events", {
        method: "POST",
        body: JSON.stringify(values),
      })
    },
    onSuccess: () => {
      toast.success(editing ? "Event updated." : "Event created.")
      queryClient.invalidateQueries({ queryKey: ["events"] })
      setOpen(false)
      setEditing(null)
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
    setOpen(true)
  }

  function openEdit(event: Event) {
    setEditing(event)
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
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(query.data)}
        skeleton={<CardsSkeleton count={6} />}
      >
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
                  <p>
                    {format(new Date(event.startsAt), "EEE d MMM yyyy, HH:mm")}
                  </p>
                  <p>{event.venue}</p>
                  <p>
                    Created by {event.createdBy.firstName}{" "}
                    {event.createdBy.lastName}
                  </p>
                  {can(role, "events:write") ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(event)}
                      >
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
                      {event.status === "DRAFT" ||
                      event.status === "CANCELLED" ? (
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
            icon={CalendarDaysIcon}
          />
        )}
      </QuerySection>

      <EventFormSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setEditing(null)
        }}
        title={editing ? "Edit event" : "Create event"}
        defaultValues={
          editing
            ? {
                title: editing.title,
                description: editing.description ?? "",
                startsAt: toLocalInput(new Date(editing.startsAt)),
                endsAt: toLocalInput(new Date(editing.endsAt)),
                venue: editing.venue,
                status: editing.status,
                capacity: editing.capacity,
              }
            : undefined
        }
        isSubmitting={saveMutation.isPending}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values)
        }}
      />
    </div>
  )
}
