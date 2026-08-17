"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import type { FirstTimer } from "@/lib/db/types"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"
import { firstTimerSchema } from "@/lib/validation/schemas"
import { format } from "date-fns"

type Values = z.infer<typeof firstTimerSchema>
type ListResponse = {
  items: Array<
    FirstTimer & {
      assignedTo: { firstName: string; lastName: string } | null
    }
  >
  total: number
}

export function FirstTimersView({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<FirstTimer | null>(null)
  const [note, setNote] = useState("")

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page), pageSize: "10" })
    if (q) search.set("q", q)
    if (status !== "ALL") search.set("status", status)
    return search.toString()
  }, [q, status, page])

  const query = useQuery({
    queryKey: ["first-timers", params],
    queryFn: () => api<ListResponse>(`/api/first-timers?${params}`),
  })
  const options = useQuery({
    queryKey: ["options"],
    queryFn: () =>
      api<{
        followUpUsers: Array<{ id: string; firstName: string; lastName: string }>
        events: Array<{ id: string; title: string }>
      }>("/api/options"),
  })

  const form = useForm<Values>({
    resolver: zodResolver(firstTimerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      gender: "MALE",
      invitedBy: "",
      eventId: "",
      prayerRequest: "",
      assignedToId: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: Values) =>
      api("/api/first-timers", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success("First timer registered.")
      queryClient.invalidateQueries({ queryKey: ["first-timers"] })
      setOpen(false)
      form.reset()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: string; assignedToId?: string }) =>
      api(`/api/first-timers/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: payload.status,
          assignedToId: payload.assignedToId,
        }),
      }),
    onSuccess: () => {
      toast.success("Follow-up updated.")
      queryClient.invalidateQueries({ queryKey: ["first-timers"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const noteMutation = useMutation({
    mutationFn: (payload: { id: string; note: string }) =>
      api(`/api/first-timers/${payload.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ type: "NOTE", note: payload.note }),
      }),
    onSuccess: () => {
      toast.success("Note saved.")
      setNote("")
      queryClient.invalidateQueries({ queryKey: ["first-timers"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div>
      <PageHeader
        title="First Timers"
        description="Register visitors and track follow-up through Treasure Hunt."
        action={
          can(role, "first-timers:create")
            ? { label: "Register first timer", onClick: () => setOpen(true) }
            : undefined
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search visitors"
          className="max-w-xs"
          value={q}
          onChange={(event) => {
            setPage(1)
            setQ(event.target.value)
          }}
        />
        <Select
          value={status}
          onValueChange={(value) => value && setStatus(value)}
          items={{
            ALL: "All statuses",
            NEW: "New",
            CONTACTED: "Contacted",
            VISITED: "Visited",
            RETURNED: "Returned",
            TREASURE_HUNT: "Treasure Hunt",
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="VISITED">Visited</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="TREASURE_HUNT">Treasure Hunt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {query.data?.items.length ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Date visited</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.firstName} {item.lastName}
                  </TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.gender} />
                  </TableCell>
                  <TableCell>{format(new Date(item.registeredAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.status} />
                  </TableCell>
                  <TableCell>
                    {item.assignedTo
                      ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
                      : "Unassigned"}
                  </TableCell>
                  <TableCell className="text-right">
                    {can(role, "first-timers:follow-up") ? (
                      <Button variant="ghost" size="sm" onClick={() => setSelected(item)}>
                        Follow up
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No first timers yet"
          description="Register a visitor after Sunday service to start follow-up."
        />
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Register First Timer</SheetTitle>
            <SheetDescription>
              Capture the visitor details needed for follow-up.
            </SheetDescription>
          </SheetHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit((values) => createMutation.mutateAsync(values))}
          >
            <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>First Name</Label>
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
                <Label>Last Name</Label>
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
                <Label>Phone</Label>
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
            </div>
            <div className="grid gap-1.5">
              <Label>Address</Label>
              <Input {...form.register("address")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Gender</Label>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(value) => value && form.setValue("gender", value as Values["gender"])}
                  items={{ MALE: "Male", FEMALE: "Female" }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={Boolean(form.formState.errors.gender)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Invited by</Label>
                <Input {...form.register("invitedBy")} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Service / Event attended</Label>
              <Select
                value={form.watch("eventId") || "NONE"}
                onValueChange={(value) => form.setValue("eventId", value === "NONE" ? "" : value ?? "")}
                items={[
                  { value: "NONE", label: "Not specified" },
                  ...(options.data?.events.map((event) => ({
                    value: event.id,
                    label: event.title,
                  })) ?? []),
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not specified</SelectItem>
                  {options.data?.events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Assigned follow-up person</Label>
              <Select
                value={form.watch("assignedToId") || "NONE"}
                onValueChange={(value) =>
                  form.setValue("assignedToId", value === "NONE" ? "" : value ?? "")
                }
                items={[
                  { value: "NONE", label: "Unassigned" },
                  ...(options.data?.followUpUsers.map((person) => ({
                    value: person.id,
                    label: `${person.firstName} ${person.lastName}`,
                  })) ?? []),
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {options.data?.followUpUsers.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Prayer request</Label>
              <Textarea {...form.register("prayerRequest")} />
            </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="brand" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending} isLoadingText="Submitting...">
                Submit
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selected)} onOpenChange={(value) => !value && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selected ? `${selected.firstName} ${selected.lastName}` : "Follow up"}
            </SheetTitle>
            <SheetDescription>Update status and add a follow-up note.</SheetDescription>
          </SheetHeader>
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <StatusBadge value={selected.status} />
                  <Select
                    value={selected.status}
                    onValueChange={(value) => {
                      if (!value) return
                      statusMutation.mutate({ id: selected.id, status: value })
                      setSelected({
                        ...selected,
                        status: value as FirstTimer["status"],
                      })
                    }}
                    items={{
                      NEW: "New",
                      CONTACTED: "Contacted",
                      VISITED: "Visited",
                      RETURNED: "Returned",
                      TREASURE_HUNT: "Treasure Hunt",
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="VISITED">Visited</SelectItem>
                      <SelectItem value="RETURNED">Returned</SelectItem>
                      <SelectItem value="TREASURE_HUNT">Treasure Hunt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Note</Label>
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </div>
              <SheetFooter>
                <Button
                  type="button"
                  variant="brand"
                  onClick={() => setSelected(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => noteMutation.mutate({ id: selected.id, note })}
                  disabled={!note}
                  isLoading={noteMutation.isPending}
                  isLoadingText="Saving..."
                >
                  Save note
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
