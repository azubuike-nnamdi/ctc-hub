"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { GraduationCapIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ClassFormSheet } from "@/components/classes/class-form-sheet"
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
import type { DiscipleshipClassStatus, DiscipleshipProgram } from "@/lib/db/enums"
import {
  DISCIPLESHIP_CLASS_STATUS_LABELS,
  DISCIPLESHIP_CLASS_STATUSES,
} from "@/lib/utils/labels"
import { discipleshipClassCreateSchema } from "@/lib/validation/schemas"
import { z } from "zod"

type ClassSummary = {
  id: string
  program: DiscipleshipProgram
  title: string
  startsOn: string
  endsOn: string
  status: DiscipleshipClassStatus
  facilitatorName: string | null
  sessionCount: number
  enrollmentCount: number
  createdBy?: { firstName: string; lastName: string }
}

type Values = z.infer<typeof discipleshipClassCreateSchema>

export function ClassesView({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [program, setProgram] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [open, setOpen] = useState(false)
  const canWrite = can(role, "soul-tracker:write")

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: "1", pageSize: "24" })
    if (q) search.set("q", q)
    if (program !== "ALL") search.set("program", program)
    if (status !== "ALL") search.set("status", status)
    return search.toString()
  }, [q, program, status])

  const query = useQuery({
    queryKey: ["classes", params],
    queryFn: () =>
      api<{ items: ClassSummary[] }>(`/api/classes?${params}`),
  })

  const createMutation = useMutation({
    mutationFn: (values: Values) =>
      api<ClassSummary>("/api/classes", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Class created.")
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      setOpen(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div>
      <PageHeader
        title="Classes"
        description="MIP is one Sunday per set of first timers. Mark them present and they become members. SOD is eight Sundays after MIP."
        action={
          canWrite
            ? { label: "Create class", onClick: () => setOpen(true) }
            : undefined
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search classes"
          className="max-w-xs"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          value={program}
          onValueChange={(value) => value && setProgram(value)}
          items={{ ALL: "All programs", MIP: "MIP", SOD: "SOD" }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All programs</SelectItem>
            <SelectItem value="MIP">MIP</SelectItem>
            <SelectItem value="SOD">SOD</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => value && setStatus(value)}
          items={{
            ALL: "All statuses",
            ...DISCIPLESHIP_CLASS_STATUS_LABELS,
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {DISCIPLESHIP_CLASS_STATUSES.filter((item) => item !== "DRAFT").map(
              (item) => (
                <SelectItem key={item} value={item}>
                  {DISCIPLESHIP_CLASS_STATUS_LABELS[item]}
                </SelectItem>
              )
            )}
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
            {query.data.items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <StatusBadge value={item.status} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={item.program} />
                    <span>
                      {item.sessionCount} Sunday
                      {item.sessionCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p>
                    {format(new Date(item.startsOn), "d MMM yyyy")}
                    {" – "}
                    {format(new Date(item.endsOn), "d MMM yyyy")}
                  </p>
                  <p>
                    {item.enrollmentCount} on the roster
                    {item.facilitatorName ? ` · ${item.facilitatorName}` : ""}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-fit"
                    render={<Link href={`/admin/classes/${item.id}`} />}
                  >
                    Open class
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes yet"
            description="Create an MIP class for one Sunday, or announce an 8-week SOD class."
            icon={GraduationCapIcon}
          />
        )}
      </QuerySection>
      <ClassFormSheet
        open={open}
        onOpenChange={setOpen}
        isSubmitting={createMutation.isPending}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values)
        }}
      />
    </div>
  )
}
