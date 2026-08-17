"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"
import type { SoulStage } from "@/lib/db/enums"
import { format } from "date-fns"

import { WaypointsIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection, TableSkeleton } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { SOUL_STAGE_LABELS, SOUL_STAGES } from "@/lib/utils/labels"

type Item = {
  id: string
  currentStage: SoulStage
  personName: string
  assignedTo: { firstName: string; lastName: string } | null
  createdAt: string
  firstTimer: { id: string } | null
  member: { memberCode: string } | null
}

export function SoulTrackerList() {
  const [q, setQ] = useState("")
  const [stage, setStage] = useState("ALL")
  const params = useMemo(() => {
    const search = new URLSearchParams({ page: "1", pageSize: "20" })
    if (q) search.set("q", q)
    if (stage !== "ALL") search.set("stage", stage)
    return search.toString()
  }, [q, stage])

  const query = useQuery({
    queryKey: ["soul-tracker", params],
    queryFn: () => api<{ items: Item[] }>(`/api/soul-tracker?${params}`),
  })

  return (
    <div>
      <PageHeader
        title="Soul Tracker"
        description="Monitor each person's discipleship journey."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search souls"
          className="max-w-xs"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          value={stage}
          onValueChange={(value) => value && setStage(value)}
          items={{ ALL: "All stages", ...SOUL_STAGE_LABELS }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stages</SelectItem>
            {SOUL_STAGES.map((item) => (
              <SelectItem key={item} value={item}>
                {SOUL_STAGE_LABELS[item]}
              </SelectItem>
            ))}
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
        skeleton={<TableSkeleton columns={5} />}
      >
        {query.data?.items.length ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Soul</TableHead>
                  <TableHead>Current stage</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>{item.personName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.member?.memberCode ??
                          item.firstTimer?.id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.currentStage} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {item.assignedTo
                        ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}`
                        : "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={
                          <Link href={`/admin/soul-tracker/${item.id}`} />
                        }
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No journeys yet"
            description="Soul Tracker records are created when a first timer is registered."
            icon={WaypointsIcon}
          />
        )}
      </QuerySection>
    </div>
  )
}
