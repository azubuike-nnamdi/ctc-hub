"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { QrCodeIcon } from "lucide-react"

import { FirstTimerFilters } from "@/components/first-timers/first-timer-filters"
import { FirstTimerFollowUpSheet } from "@/components/first-timers/first-timer-follow-up-sheet"
import { FirstTimerFormSheet } from "@/components/first-timers/first-timer-form-sheet"
import { FirstTimerQrDialog } from "@/components/first-timers/first-timer-qr-dialog"
import { FirstTimerTable } from "@/components/first-timers/first-timer-table"
import {
  FirstTimerStats,
  FirstTimerStatsSkeleton,
} from "@/components/first-timers/first-timer-stats"
import type {
  FirstTimerListItem,
  FirstTimerListResponse,
  FirstTimerStatsResponse,
  FollowUpOptionsResponse,
} from "@/components/first-timers/types"
import type { FirstTimerVisitorValues } from "@/components/first-timers/first-timer-form-fields"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection, TableSkeleton } from "@/components/shared/query-section"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"

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
  const [qrOpen, setQrOpen] = useState(false)
  const [selected, setSelected] = useState<FirstTimerListItem | null>(null)

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page), pageSize: "10" })
    if (q) search.set("q", q)
    if (status !== "ALL") search.set("status", status)
    return search.toString()
  }, [q, status, page])

  const statsQuery = useQuery({
    queryKey: ["first-timers", "stats"],
    queryFn: () => api<FirstTimerStatsResponse>("/api/first-timers/stats"),
  })

  const query = useQuery({
    queryKey: ["first-timers", params],
    queryFn: () => api<FirstTimerListResponse>(`/api/first-timers?${params}`),
  })
  const options = useQuery({
    queryKey: ["options"],
    queryFn: () => api<FollowUpOptionsResponse>("/api/options"),
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

  return (
    <div>
      <PageHeader
        title="First Timers"
        description="Register visitors and track follow-up through Treasure Hunt."
        extra={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setQrOpen(true)}>
              <QrCodeIcon />
              QR code
            </Button>
            {publicFormPath ? (
              <Button
                variant="outline"
                render={<Link href={publicFormPath} target="_blank" />}
              >
                Public form
              </Button>
            ) : null}
          </div>
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
        skeleton={<FirstTimerStatsSkeleton />}
      >
        <FirstTimerStats
          stats={
            statsQuery.data ?? {
              total: 0,
              new: 0,
              inFollowUp: 0,
              treasureHunt: 0,
              thisMonth: 0,
            }
          }
        />
      </QuerySection>
      <FirstTimerFilters
        query={q}
        status={status}
        onQueryChange={(value) => {
          setPage(1)
          setQ(value)
        }}
        onStatusChange={(value) => {
          setPage(1)
          setStatus(value)
        }}
      />
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(query.data)}
        skeleton={<TableSkeleton columns={8} />}
      >
        <FirstTimerTable
          items={query.data?.items ?? []}
          canFollowUp={can(role, "first-timers:follow-up")}
          onFollowUp={setSelected}
        />
      </QuerySection>

      <FirstTimerFormSheet
        open={open}
        onOpenChange={setOpen}
        isSubmitting={createMutation.isPending}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values)
        }}
      />

      <FirstTimerFollowUpSheet
        selected={selected}
        onSelectedChange={setSelected}
        followUpUsers={options.data?.followUpUsers ?? []}
        optionsPending={options.isPending}
        optionsError={options.error ?? null}
        optionsFetching={options.isFetching}
        onRetryOptions={() => options.refetch()}
      />
      <FirstTimerQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  )
}
