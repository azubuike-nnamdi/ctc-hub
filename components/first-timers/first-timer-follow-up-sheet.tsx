"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import type { FirstTimer } from "@/lib/db/types"
import type { FirstTimerStatus } from "@/lib/db/enums"

import { FollowUpActivityForm } from "@/components/follow-up/follow-up-activity-form"
import { FollowUpActivityList } from "@/components/follow-up/follow-up-activity-list"
import { FollowUpAssigneeSelect } from "@/components/follow-up/follow-up-assignee-select"
import { FollowUpDueBadge } from "@/components/follow-up/follow-up-due-badge"
import type { FirstTimerListItem } from "@/components/first-timers/types"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { api } from "@/lib/api/client"
import {
  AGE_RANGE_LABELS,
  FIRST_TIMER_CREATED_BY_LABELS,
  FIRST_TIMER_STATUS_LABELS,
  OPEN_FIRST_TIMER_STATUSES,
  HEAR_ABOUT_LABELS,
  MEMBERSHIP_INTEREST_LABELS,
} from "@/lib/utils/labels"

type FollowUpUser = {
  id: string
  firstName: string
  lastName: string
  departments?: string[]
}

type FirstTimerDetail = FirstTimerListItem & {
  occupation: string | null
  birthday: string | null
  ageRange: FirstTimer["ageRange"]
  membershipInterest: FirstTimer["membershipInterest"]
  hearAboutUs: FirstTimer["hearAboutUs"]
  hearAboutOther: string | null
  prayerRequest: string | null
  nextContactAt?: string | null
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

export function FirstTimerFollowUpSheet({
  selected,
  onSelectedChange,
  followUpUsers,
  optionsPending,
  optionsError,
  optionsFetching,
  onRetryOptions,
}: {
  selected: FirstTimerListItem | null
  onSelectedChange: (item: FirstTimerListItem | null) => void
  followUpUsers: FollowUpUser[]
  optionsPending: boolean
  optionsError: Error | null
  optionsFetching: boolean
  onRetryOptions: () => void
}) {
  const queryClient = useQueryClient()
  const selectedId = selected?.id ?? null
  const [trackedId, setTrackedId] = useState(selectedId)
  const [draftStatus, setDraftStatus] = useState<FirstTimer["status"] | null>(
    null
  )
  const [draftAssignedToId, setDraftAssignedToId] = useState<
    string | null | undefined
  >(undefined)
  const [draftAssignedTo, setDraftAssignedTo] = useState<
    FirstTimerListItem["assignedTo"] | undefined
  >(undefined)

  if (selectedId !== trackedId) {
    setTrackedId(selectedId)
    setDraftStatus(null)
    setDraftAssignedToId(undefined)
    setDraftAssignedTo(undefined)
  }

  const detailQuery = useQuery({
    queryKey: ["first-timers", selected?.id],
    queryFn: () => api<FirstTimerDetail>(`/api/first-timers/${selected?.id}`),
    enabled: Boolean(selected?.id),
    refetchOnMount: false,
  })
  const visitor = detailQuery.data ?? selected
  const status = draftStatus ?? selected?.status
  const assignedToId =
    draftAssignedToId === undefined
      ? (selected?.assignedToId ?? null)
      : draftAssignedToId
  const assignedTo =
    draftAssignedTo === undefined ? (selected?.assignedTo ?? null) : draftAssignedTo
  const followUpDirty =
    Boolean(selected) &&
    (status !== selected?.status ||
      assignedToId !== (selected?.assignedToId ?? null))

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
      void queryClient.invalidateQueries({ queryKey: ["first-timers"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const activityMutation = useMutation({
    mutationFn: (payload: {
      id: string
      type: string
      note: string
      contactedAt: string
      wouldWorshipAgain: boolean | null
      nextContactAt: string
      closeFollowUp: boolean
      status?: FirstTimerStatus
    }) =>
      api(`/api/first-timers/${payload.id}/notes`, {
        method: "POST",
        body: JSON.stringify({
          type: payload.type,
          note: payload.note,
          contactedAt: payload.contactedAt,
          wouldWorshipAgain: payload.wouldWorshipAgain,
          nextContactAt: payload.nextContactAt,
          closeFollowUp: payload.closeFollowUp,
          status: payload.status,
        }),
      }),
    onSuccess: () => {
      toast.success("Activity saved.")
      void queryClient.invalidateQueries({ queryKey: ["first-timers"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const assignees = withCurrentAssignee(
    followUpUsers,
    selected ? { ...selected, assignedToId, assignedTo } : null
  )

  return (
    <Sheet
      open={Boolean(selected)}
      onOpenChange={(value) => !value && onSelectedChange(null)}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {selected
              ? `${selected.firstName} ${selected.lastName}`
              : "Follow up"}
          </SheetTitle>
          <SheetDescription>
            Assign Mission or Follow-up members and log calls, visits, and
            notes.
          </SheetDescription>
        </SheetHeader>
        {selected && visitor ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
            <div className="grid content-start gap-4">
              <dl className="grid gap-2 text-sm">
                <Detail
                  label="Registered by"
                  value={
                    visitor.createdBy === "SELF"
                      ? FIRST_TIMER_CREATED_BY_LABELS.SELF
                      : visitor.createdByUser
                        ? `${visitor.createdByUser.firstName} ${visitor.createdByUser.lastName}`
                        : FIRST_TIMER_CREATED_BY_LABELS.STAFF
                  }
                />
                {visitor.occupation ? (
                  <Detail label="Occupation" value={visitor.occupation} />
                ) : null}
                {visitor.birthday ? (
                  <Detail label="Birthday" value={visitor.birthday} />
                ) : null}
                {visitor.ageRange ? (
                  <Detail
                    label="Age range"
                    value={AGE_RANGE_LABELS[visitor.ageRange]}
                  />
                ) : null}
                {visitor.membershipInterest ? (
                  <Detail
                    label="Wants membership"
                    value={
                      MEMBERSHIP_INTEREST_LABELS[visitor.membershipInterest]
                    }
                  />
                ) : null}
                {visitor.hearAboutUs?.length ? (
                  <Detail
                    label="Heard about us"
                    value={visitor.hearAboutUs
                      .map((source) =>
                        source === "OTHER" && visitor.hearAboutOther
                          ? `Others (${visitor.hearAboutOther})`
                          : HEAR_ABOUT_LABELS[source]
                      )
                      .join(", ")}
                  />
                ) : null}
                {visitor.prayerRequest ? (
                  <Detail
                    label="Prayer request"
                    value={visitor.prayerRequest}
                  />
                ) : null}
              </dl>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={status ?? selected.status} />
                  <FollowUpDueBadge
                    nextContactAt={
                      detailQuery.data?.nextContactAt ?? selected.nextContactAt
                    }
                  />
                </div>
                {selected.status === "MEMBER" ? (
                  <p className="text-sm text-muted-foreground">
                    This visitor is now a member after MIP. They stay in this
                    list so we can track who came through first timer. Follow-up
                    continues on their journey.
                  </p>
                ) : (
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      if (value) setDraftStatus(value as FirstTimer["status"])
                    }}
                    items={FIRST_TIMER_STATUS_LABELS}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPEN_FIRST_TIMER_STATUSES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {FIRST_TIMER_STATUS_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <FollowUpAssigneeSelect
                value={assignedToId}
                options={assignees}
                isPending={optionsPending}
                isError={Boolean(optionsError)}
                error={optionsError}
                isRetrying={optionsFetching}
                onRetry={onRetryOptions}
                onChange={(nextAssignedToId, person) => {
                  setDraftAssignedToId(nextAssignedToId || null)
                  setDraftAssignedTo(
                    person
                      ? {
                          id: person.id,
                          firstName: person.firstName,
                          lastName: person.lastName,
                        }
                      : null
                  )
                }}
              />
              <Button
                type="button"
                className="w-fit"
                disabled={!followUpDirty}
                isLoading={statusMutation.isPending}
                isLoadingText="Saving..."
                onClick={() => {
                  if (!status) return
                  statusMutation.mutate({
                    id: selected.id,
                    status,
                    assignedToId: assignedToId ?? "",
                  })
                  onSelectedChange({
                    ...selected,
                    status,
                    assignedToId,
                    assignedTo,
                  })
                  setDraftStatus(null)
                  setDraftAssignedToId(undefined)
                  setDraftAssignedTo(undefined)
                }}
              >
                Save follow-up
              </Button>
              <FollowUpActivityForm
                showWorshipQuestion
                isSubmitting={activityMutation.isPending}
                onSubmit={async (values) => {
                  await activityMutation.mutateAsync({
                    id: selected.id,
                    ...values,
                  })
                }}
              />
              <div className="grid gap-2">
                <p className="text-sm font-medium">Activity history</p>
                <FollowUpActivityList
                  activities={detailQuery.data?.activities ?? []}
                />
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function withCurrentAssignee(
  users: FollowUpUser[],
  selected: FirstTimerListItem | null
) {
  if (!selected?.assignedTo || !selected.assignedToId) {
    return users
  }
  if (users.some((person) => person.id === selected.assignedToId)) {
    return users
  }
  return [
    ...users,
    {
      id: selected.assignedToId,
      firstName: selected.assignedTo.firstName,
      lastName: selected.assignedTo.lastName,
    },
  ]
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
