"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import type { FirstTimerStatus, SoulStage } from "@/lib/db/enums"

import { FollowUpActivityForm } from "@/components/follow-up/follow-up-activity-form"
import { FollowUpActivityList } from "@/components/follow-up/follow-up-activity-list"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { api } from "@/lib/api/client"
import { fullName } from "@/lib/utils/labels"
import { PhoneCallIcon } from "lucide-react"

type Activity = {
  id: string
  type: string
  note: string
  contactedAt?: string
  wouldWorshipAgain?: boolean | null
  createdAt: string
  createdBy: { firstName: string; lastName: string }
}

type AssignedFirstTimer = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  gender: string
  status: FirstTimerStatus
  registeredAt: string
  prayerRequest: string | null
  membershipInterest: string | null
  recentActivities: Activity[]
}

type AssignedMember = {
  id: string
  memberId: string
  firstName: string
  lastName: string
  phone: string
  currentStage: SoulStage
  departments: Array<{ id: string; name: string }>
  recentActivities: Activity[]
}

type FollowUpList = {
  firstTimers: AssignedFirstTimer[]
  members: AssignedMember[]
}

type FirstTimerDetail = AssignedFirstTimer & {
  occupation: string | null
  birthday: string | null
  ageRange: string | null
  hearAboutUs: string[]
  hearAboutOther: string | null
  activities: Activity[]
}

type MemberDetail = AssignedMember & {
  email: string | null
  activities: Activity[]
}

type Selected =
  | { kind: "first-timer"; id: string; name: string }
  | { kind: "member"; id: string; name: string }

export function MemberFollowUpView() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Selected | null>(null)
  const query = useQuery({
    queryKey: ["me", "follow-up"],
    queryFn: () => api<FollowUpList>("/api/me/follow-up"),
  })

  return (
    <div>
      <PageHeader
        title="Follow-up"
        description="People assigned to you from Mission or Follow-up. Log calls, visits, and whether they would worship with us again."
      />
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(query.data)}
      >
        {query.data &&
        !query.data.firstTimers.length &&
        !query.data.members.length ? (
          <EmptyState
            title="No one assigned yet"
            description="When staff assign a first timer or member to you, they will show up here."
            icon={PhoneCallIcon}
          />
        ) : (
          <div className="grid gap-6">
            <AssignedGroup
              title="First timers"
              empty="No first timers assigned to you."
            >
              {query.data?.firstTimers.map((item) => (
                <AssignedCard
                  key={item.id}
                  name={fullName(item.firstName, item.lastName)}
                  phone={item.phone}
                  status={item.status}
                  onOpen={() =>
                    setSelected({
                      kind: "first-timer",
                      id: item.id,
                      name: fullName(item.firstName, item.lastName),
                    })
                  }
                />
              ))}
            </AssignedGroup>
            <AssignedGroup title="Members" empty="No members assigned to you.">
              {query.data?.members.map((item) => (
                <AssignedCard
                  key={item.id}
                  name={fullName(item.firstName, item.lastName)}
                  phone={item.phone}
                  status={item.currentStage}
                  departments={item.departments}
                  onOpen={() =>
                    setSelected({
                      kind: "member",
                      id: item.id,
                      name: fullName(item.firstName, item.lastName),
                    })
                  }
                />
              ))}
            </AssignedGroup>
          </div>
        )}
      </QuerySection>

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(value) => !value && setSelected(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected?.name ?? "Follow up"}</SheetTitle>
            <SheetDescription>
              Log when you called or visited, and capture the next step.
            </SheetDescription>
          </SheetHeader>
          {selected?.kind === "first-timer" ? (
            <FirstTimerFollowUpBody
              id={selected.id}
              onSaved={() =>
                queryClient.invalidateQueries({ queryKey: ["me", "follow-up"] })
              }
            />
          ) : null}
          {selected?.kind === "member" ? (
            <MemberFollowUpBody
              id={selected.id}
              onSaved={() =>
                queryClient.invalidateQueries({ queryKey: ["me", "follow-up"] })
              }
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FirstTimerFollowUpBody({
  id,
  onSaved,
}: {
  id: string
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["me", "follow-up", "first-timer", id],
    queryFn: () =>
      api<FirstTimerDetail>(`/api/me/follow-up/first-timers/${id}`),
  })
  const mutation = useMutation({
    mutationFn: (values: {
      type: string
      note: string
      contactedAt: string
      wouldWorshipAgain: boolean | null
      status?: FirstTimerStatus
    }) =>
      api(`/api/me/follow-up/first-timers/${id}/activities`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Activity saved.")
      queryClient.invalidateQueries({
        queryKey: ["me", "follow-up", "first-timer", id],
      })
      onSaved()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const item = query.data
  if (query.isPending) {
    return <p className="px-4 text-sm text-muted-foreground">Loading...</p>
  }
  if (!item) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        Could not load this first timer.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
      <div className="grid gap-4">
        <div className="grid gap-1 text-sm">
          <p>
            {item.phone}
            {item.email ? ` · ${item.email}` : ""}
          </p>
          <StatusBadge value={item.status} />
          {item.prayerRequest ? (
            <p className="text-muted-foreground">{item.prayerRequest}</p>
          ) : null}
        </div>
        <FollowUpActivityForm
          showWorshipQuestion
          showStatus
          currentStatus={item.status}
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync(values)
          }}
        />
        <FollowUpActivityList activities={item.activities} />
      </div>
    </div>
  )
}

function MemberFollowUpBody({
  id,
  onSaved,
}: {
  id: string
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["me", "follow-up", "soul", id],
    queryFn: () => api<MemberDetail>(`/api/me/follow-up/souls/${id}`),
  })
  const mutation = useMutation({
    mutationFn: (values: { type: string; note: string; contactedAt: string }) =>
      api(`/api/me/follow-up/souls/${id}/activities`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Activity saved.")
      queryClient.invalidateQueries({
        queryKey: ["me", "follow-up", "soul", id],
      })
      onSaved()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const item = query.data
  if (query.isPending) {
    return <p className="px-4 text-sm text-muted-foreground">Loading...</p>
  }
  if (!item) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        Could not load this member.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
      <div className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <p>{item.phone}</p>
          <StatusBadge value={item.currentStage} />
          {item.departments.length ? (
            <div className="flex flex-wrap gap-1.5">
              {item.departments.map((department) => (
                <Badge
                  key={department.id}
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  {department.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <FollowUpActivityForm
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync(values)
          }}
        />
        <FollowUpActivityList activities={item.activities} />
      </div>
    </div>
  )
}

function AssignedGroup({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: ReactNode
}) {
  const items = Array.isArray(children) ? children : [children]
  const hasItems = items.filter(Boolean).length > 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {hasItems ? (
          children
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  )
}

function AssignedCard({
  name,
  phone,
  status,
  departments,
  onOpen,
}: {
  name: string
  phone: string
  status: string
  departments?: Array<{ id: string; name: string }>
  onOpen: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{phone}</p>
        {departments?.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {departments.map((department) => (
              <Badge
                key={department.id}
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                {department.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge value={status} />
        <Button variant="outline" size="sm" onClick={onOpen}>
          Log activity
        </Button>
      </div>
    </div>
  )
}
