"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import type { SoulStage } from "@/lib/db/enums"

import { FollowUpActivityForm } from "@/components/follow-up/follow-up-activity-form"
import { FollowUpActivityList } from "@/components/follow-up/follow-up-activity-list"
import { FollowUpAssigneeSelect } from "@/components/follow-up/follow-up-assignee-select"
import { JourneyStepper } from "@/components/shared/journey-stepper"
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-label-provider"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

type Detail = {
  id: string
  currentStage: SoulStage
  notes: string | null
  assignedToId: string | null
  firstTimer: { id?: string; firstName: string; lastName: string } | null
  member: {
    id: string
    firstName: string
    lastName: string
    memberCode?: string
  } | null
  assignedTo: { id?: string; firstName: string; lastName: string } | null
  stages: Array<{ id: string; stage: SoulStage; reachedAt: string }>
  activities: Array<{
    id: string
    type: string
    note: string
    contactedAt?: string
    wouldWorshipAgain?: boolean | null
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
  const [draftStage, setDraftStage] = useState<SoulStage | null>(null)
  const stage = draftStage ?? record.currentStage
  const canWrite = can(role, "soul-tracker:write")
  const options = useQuery({
    queryKey: ["options"],
    queryFn: () =>
      api<{
        followUpUsers: Array<{
          id: string
          firstName: string
          lastName: string
          departments?: string[]
        }>
      }>("/api/options"),
    enabled: canWrite,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: {
      currentStage?: SoulStage
      notes?: string
      assignedToId?: string
    }) =>
      api<{
        promotedToMember?: boolean
        promotion?: { memberId: string; created: boolean } | null
      }>(`/api/soul-tracker/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data, variables) => {
      if (data.promotedToMember && data.promotion?.created) {
        toast.success("MIP is complete, so this first timer is now a member.")
      } else if (data.promotedToMember) {
        toast.success("This journey is now linked to a member record.")
      } else {
        toast.success("Journey updated.")
      }
      if (variables.currentStage) {
        setDraftStage(null)
      }
      queryClient.invalidateQueries({ queryKey: ["soul-tracker", id] })
      queryClient.invalidateQueries({ queryKey: ["member"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
      queryClient.invalidateQueries({ queryKey: ["first-timers"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const activityMutation = useMutation({
    mutationFn: (payload: {
      type: string
      note: string
      contactedAt: string
      wouldWorshipAgain: boolean | null
    }) =>
      api(`/api/soul-tracker/${id}/activities`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Activity recorded.")
      queryClient.invalidateQueries({ queryKey: ["soul-tracker", id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const name = record.member
    ? fullName(record.member.firstName, record.member.lastName)
    : record.firstTimer
      ? fullName(record.firstTimer.firstName, record.firstTimer.lastName)
      : "Unknown"
  const followUpUsers = options.data?.followUpUsers ?? []
  const assignees =
    record.assignedTo &&
    record.assignedToId &&
    !followUpUsers.some((person) => person.id === record.assignedToId)
      ? [
          ...followUpUsers,
          {
            id: record.assignedToId,
            firstName: record.assignedTo.firstName,
            lastName: record.assignedTo.lastName,
          },
        ]
      : followUpUsers

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Soul Tracker</p>
          <h2 className="text-2xl font-semibold">{name}</h2>
          {record.member ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Member {record.member.memberCode ?? "record"} after completing
              MIP.
            </p>
          ) : null}
        </div>
        {record.member ? (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/admin/members/${record.member.id}`} />}
          >
            Open member
          </Button>
        ) : null}
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
        <CardContent>
          <JourneyStepper stage={record.currentStage} />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current stage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <StatusBadge value={record.currentStage} />
            {canWrite ? (
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
            {canWrite ? (
              <FollowUpAssigneeSelect
                value={record.assignedToId}
                options={assignees}
                isPending={options.isPending}
                isError={options.isError}
                error={options.error ?? null}
                isRetrying={options.isFetching}
                onRetry={() => options.refetch()}
                onChange={(assignedToId) => {
                  updateMutation.mutate({ assignedToId })
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Assigned worker:{" "}
                {record.assignedTo
                  ? `${record.assignedTo.firstName} ${record.assignedTo.lastName}`
                  : "Unassigned"}
              </p>
            )}
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
                if (canWrite) {
                  updateMutation.mutate({ notes: event.target.value })
                }
              }}
              readOnly={!canWrite}
            />
            {canWrite ? (
              <FollowUpActivityForm
                showWorshipQuestion={Boolean(record.firstTimer)}
                isSubmitting={activityMutation.isPending}
                onSubmit={async (values) => {
                  await activityMutation.mutateAsync(values)
                }}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Engagement history</CardTitle>
        </CardHeader>
        <CardContent>
          <FollowUpActivityList activities={record.activities} />
        </CardContent>
      </Card>
    </div>
  )
}
