"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import type { SoulStage } from "@/lib/db/enums"

import { ArrowRightIcon, NotebookPenIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-label-provider"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import {
  SOUL_STAGE_LABELS,
  SOUL_STAGES,
  fullName,
  soulProgress,
} from "@/lib/utils/labels"
import { format } from "date-fns"

type Detail = {
  id: string
  currentStage: SoulStage
  notes: string | null
  firstTimer: { firstName: string; lastName: string } | null
  member: { firstName: string; lastName: string } | null
  assignedTo: { firstName: string; lastName: string } | null
  stages: Array<{ id: string; stage: SoulStage; reachedAt: string }>
  activities: Array<{
    id: string
    type: string
    note: string
    createdAt: string
    createdBy: { firstName: string; lastName: string }
  }>
}

export function SoulTrackerDetail({ id, role }: { id: string; role: Role }) {
  const query = useQuery({
    queryKey: ["soul-tracker", id],
    queryFn: () => api<Detail>(`/api/soul-tracker/${id}`),
  })
  const record = query.data
  const name = record?.member
    ? fullName(record.member.firstName, record.member.lastName)
    : record?.firstTimer
      ? fullName(record.firstTimer.firstName, record.firstTimer.lastName)
      : undefined

  useBreadcrumbLabel(id, name)

  return (
    <QuerySection
      isPending={query.isPending}
      isError={query.isError}
      isFetching={query.isFetching}
      error={query.error}
      onRetry={() => query.refetch()}
      hasData={Boolean(query.data)}
    >
      {query.data ? (
        <SoulTrackerDetailBody id={id} role={role} record={query.data} />
      ) : null}
    </QuerySection>
  )
}

function SoulTrackerDetailBody({
  id,
  role,
  record,
}: {
  id: string
  role: Role
  record: Detail
}) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState("")
  const [draftStage, setDraftStage] = useState<SoulStage | null>(null)
  const stage = draftStage ?? record.currentStage

  const updateMutation = useMutation({
    mutationFn: (payload: { currentStage?: SoulStage; notes?: string }) =>
      api(`/api/soul-tracker/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      toast.success("Journey updated.")
      if (variables.currentStage) {
        setDraftStage(null)
      }
      queryClient.invalidateQueries({ queryKey: ["soul-tracker", id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const activityMutation = useMutation({
    mutationFn: () =>
      api(`/api/soul-tracker/${id}/activities`, {
        method: "POST",
        body: JSON.stringify({ type: "NOTE", note }),
      }),
    onSuccess: () => {
      toast.success("Activity recorded.")
      setNote("")
      queryClient.invalidateQueries({ queryKey: ["soul-tracker", id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const name = record.member
    ? fullName(record.member.firstName, record.member.lastName)
    : record.firstTimer
      ? fullName(record.firstTimer.firstName, record.firstTimer.lastName)
      : "Unknown"

  const reached = new Set(record.stages.map((item) => item.stage))
  reached.add(record.currentStage)

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Soul Tracker</p>
        <h2 className="text-2xl font-semibold">{name}</h2>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Discipleship journey</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {soulProgress(record.currentStage)}%
            </span>
            <Progress
              value={soulProgress(record.currentStage)}
              className="w-32"
            />
          </div>
        </CardHeader>
        <CardContent className="flex items-start gap-1 overflow-x-auto pb-1">
          {SOUL_STAGES.map((item, index) => {
            const complete =
              reached.has(item) &&
              SOUL_STAGES.indexOf(record.currentStage) >= index
            const current = record.currentStage === item
            const connectorReached =
              SOUL_STAGES.indexOf(record.currentStage) > index
            return (
              <div key={item} className="flex min-w-0 items-start">
                <div className="min-w-24 text-center">
                  <div
                    className={`mx-auto flex size-10 items-center justify-center rounded-full border text-xs ${
                      current
                        ? "border-primary bg-primary text-primary-foreground"
                        : complete
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className="mt-2">
                    <StatusBadge value={item} />
                  </p>
                </div>
                {index < SOUL_STAGES.length - 1 ? (
                  <ArrowRightIcon
                    aria-hidden="true"
                    className={`mt-3 size-4 shrink-0 ${
                      connectorReached
                        ? "text-primary"
                        : "text-muted-foreground/50"
                    }`}
                  />
                ) : null}
              </div>
            )
          })}
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current stage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <StatusBadge value={record.currentStage} />
            {can(role, "soul-tracker:write") ? (
              <>
                <Select
                  value={stage}
                  onValueChange={(value) => {
                    if (value) setDraftStage(value as SoulStage)
                  }}
                  items={SOUL_STAGE_LABELS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUL_STAGES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {SOUL_STAGE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-fit"
                  disabled={stage === record.currentStage}
                  isLoading={
                    updateMutation.isPending &&
                    Boolean(updateMutation.variables?.currentStage)
                  }
                  isLoadingText="Updating..."
                  onClick={() => updateMutation.mutate({ currentStage: stage })}
                >
                  Update
                </Button>
              </>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Assigned worker:{" "}
              {record.assignedTo
                ? `${record.assignedTo.firstName} ${record.assignedTo.lastName}`
                : "Unassigned"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea
              defaultValue={record.notes ?? ""}
              onBlur={(event) => {
                if (can(role, "soul-tracker:write")) {
                  updateMutation.mutate({ notes: event.target.value })
                }
              }}
              readOnly={!can(role, "soul-tracker:write")}
            />
            {can(role, "soul-tracker:write") ? (
              <>
                <Label>Follow-up activity</Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button
                  onClick={() => activityMutation.mutate()}
                  disabled={!note}
                  isLoading={activityMutation.isPending}
                  isLoadingText="Saving..."
                >
                  Save activity
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Engagement history</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {record.activities.length === 0 ? (
            <EmptyState
              title="No follow-up activities yet"
              description="Notes and visits logged for this journey will appear here."
              icon={NotebookPenIcon}
              className="border-0 py-6"
            />
          ) : (
            record.activities.map((activity) => (
              <div key={activity.id} className="border-b pb-3 last:border-0">
                <StatusBadge value={activity.type} />
                <p className="mt-2 text-sm text-muted-foreground">
                  {activity.note}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.createdBy.firstName} {activity.createdBy.lastName} ·{" "}
                  {format(new Date(activity.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
