"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { FirstTimer } from "@/lib/db/types"

import { UserPlusIcon } from "lucide-react"

import { FirstTimerFormSheet } from "@/components/first-timers/first-timer-form-sheet"
import type { FirstTimerVisitorValues } from "@/components/first-timers/first-timer-form-fields"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection, TableSkeleton } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  AGE_RANGE_LABELS,
  FIRST_TIMER_CREATED_BY_LABELS,
  HEAR_ABOUT_LABELS,
  MEMBERSHIP_INTEREST_LABELS,
} from "@/lib/utils/labels"
import { format } from "date-fns"
import Link from "next/link"

type ListResponse = {
  items: Array<
    FirstTimer & {
      assignedTo: { firstName: string; lastName: string } | null
      createdByUser: { firstName: string; lastName: string } | null
    }
  >
  total: number
}

type StatsResponse = {
  total: number
  new: number
  inFollowUp: number
  treasureHunt: number
  thisMonth: number
}

export function FirstTimersView({
  role,
  publicFormPath,
}: {
  role: Role
  publicFormPath?: string
}) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<
    ListResponse["items"][number] | null
  >(null)
  const [note, setNote] = useState("")

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page), pageSize: "10" })
    if (q) search.set("q", q)
    if (status !== "ALL") search.set("status", status)
    return search.toString()
  }, [q, status, page])

  const statsQuery = useQuery({
    queryKey: ["first-timers", "stats"],
    queryFn: () => api<StatsResponse>("/api/first-timers/stats"),
  })

  const query = useQuery({
    queryKey: ["first-timers", params],
    queryFn: () => api<ListResponse>(`/api/first-timers?${params}`),
  })
  const options = useQuery({
    queryKey: ["options"],
    queryFn: () =>
      api<{
        followUpUsers: Array<{
          id: string
          firstName: string
          lastName: string
        }>
      }>("/api/options"),
  })

  const createMutation = useMutation({
    mutationFn: (values: FirstTimerVisitorValues) =>
      api("/api/first-timers", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("First timer registered.")
      queryClient.invalidateQueries({ queryKey: ["first-timers"] })
      setOpen(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const statusMutation = useMutation({
    mutationFn: (payload: {
      id: string
      status: string
      assignedToId?: string
    }) =>
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
        extra={
          publicFormPath ? (
            <Button
              variant="outline"
              render={<Link href={publicFormPath} target="_blank" />}
            >
              Public form
            </Button>
          ) : undefined
        }
        action={
          can(role, "first-timers:create")
            ? { label: "Register first timer", onClick: () => setOpen(true) }
            : undefined
        }
      />
      <QuerySection
        isPending={statsQuery.isPending}
        isError={statsQuery.isError}
        isFetching={statsQuery.isFetching}
        error={statsQuery.error}
        onRetry={() => statsQuery.refetch()}
        hasData={Boolean(statsQuery.data)}
        skeleton={<StatsSkeleton />}
      >
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total first timers"
            value={statsQuery.data?.total ?? 0}
          />
          <StatCard label="New" value={statsQuery.data?.new ?? 0} />
          <StatCard
            label="In follow-up"
            value={statsQuery.data?.inFollowUp ?? 0}
          />
          <StatCard
            label="Treasure Hunt"
            value={statsQuery.data?.treasureHunt ?? 0}
          />
          <StatCard
            label="Registered this month"
            value={statsQuery.data?.thisMonth ?? 0}
          />
        </div>
      </QuerySection>
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
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(query.data)}
        skeleton={<TableSkeleton columns={8} />}
      >
        {query.data?.items.length ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Date visited</TableHead>
                  <TableHead>Registered by</TableHead>
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
                    <TableCell>
                      {format(new Date(item.registeredAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {item.createdBy === "SELF" ? (
                        <StatusBadge value="SELF" />
                      ) : item.createdByUser ? (
                        `${item.createdByUser.firstName} ${item.createdByUser.lastName}`
                      ) : (
                        "Staff"
                      )}
                    </TableCell>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(item)}
                        >
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
            icon={UserPlusIcon}
          />
        )}
      </QuerySection>

      <FirstTimerFormSheet
        open={open}
        onOpenChange={setOpen}
        isSubmitting={createMutation.isPending}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values)
        }}
      />

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(value) => !value && setSelected(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selected
                ? `${selected.firstName} ${selected.lastName}`
                : "Follow up"}
            </SheetTitle>
            <SheetDescription>
              Update status and add a follow-up note.
            </SheetDescription>
          </SheetHeader>
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
                <dl className="grid gap-2 text-sm">
                  <Detail
                    label="Registered by"
                    value={
                      selected.createdBy === "SELF"
                        ? FIRST_TIMER_CREATED_BY_LABELS.SELF
                        : selected.createdByUser
                          ? `${selected.createdByUser.firstName} ${selected.createdByUser.lastName}`
                          : FIRST_TIMER_CREATED_BY_LABELS.STAFF
                    }
                  />
                  {selected.occupation ? (
                    <Detail label="Occupation" value={selected.occupation} />
                  ) : null}
                  {selected.birthday ? (
                    <Detail label="Birthday" value={selected.birthday} />
                  ) : null}
                  {selected.ageRange ? (
                    <Detail
                      label="Age range"
                      value={AGE_RANGE_LABELS[selected.ageRange]}
                    />
                  ) : null}
                  {selected.membershipInterest ? (
                    <Detail
                      label="Wants membership"
                      value={
                        MEMBERSHIP_INTEREST_LABELS[selected.membershipInterest]
                      }
                    />
                  ) : null}
                  {selected.hearAboutUs.length ? (
                    <Detail
                      label="Heard about us"
                      value={selected.hearAboutUs
                        .map((source) =>
                          source === "OTHER" && selected.hearAboutOther
                            ? `Others (${selected.hearAboutOther})`
                            : HEAR_ABOUT_LABELS[source]
                        )
                        .join(", ")}
                    />
                  ) : null}
                  {selected.prayerRequest ? (
                    <Detail
                      label="Prayer request"
                      value={selected.prayerRequest}
                    />
                  ) : null}
                </dl>
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
                      <SelectItem value="TREASURE_HUNT">
                        Treasure Hunt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Assigned follow-up person</Label>
                  {options.isPending ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      Loading follow-up staff...
                    </p>
                  ) : options.isError ? (
                    <ErrorState
                      compact
                      title="Could not load follow-up staff."
                      description={options.error?.message}
                      onRetry={() => options.refetch()}
                      isRetrying={options.isFetching}
                    />
                  ) : (
                    <Select
                      value={selected.assignedToId || "NONE"}
                      onValueChange={(value) => {
                        if (!value) return
                        const assignedToId = value === "NONE" ? "" : value
                        statusMutation.mutate({
                          id: selected.id,
                          status: selected.status,
                          assignedToId,
                        })
                        const person = options.data?.followUpUsers.find(
                          (item) => item.id === assignedToId
                        )
                        setSelected({
                          ...selected,
                          assignedToId: assignedToId || null,
                          assignedTo: person
                            ? {
                                firstName: person.firstName,
                                lastName: person.lastName,
                              }
                            : null,
                        })
                      }}
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
                  )}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-semibold">{value.toLocaleString()}</p>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-3 h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
