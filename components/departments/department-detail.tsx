"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { Member } from "@/lib/db/types"

import { EmptyState } from "@/components/shared/empty-state"
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-label-provider"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
  DEPARTMENT_SOD_MESSAGE,
  fullName,
  hasCompletedSod,
} from "@/lib/utils/labels"

type DepartmentDetail = {
  id: string
  name: string
  members: Array<{
    id: string
    memberCode: string
    firstName: string
    lastName: string
    status: Member["status"]
    isDeleted: boolean
    assignedAt: string
  }>
}

type MemberList = { items: Member[] }

function canManage(role: Role) {
  return can(role, "members:write") && role !== "USHER"
}

export function DepartmentDetail({ id, role }: { id: string; role: Role }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const manage = canManage(role)

  const query = useQuery({
    queryKey: ["department", id],
    queryFn: () => api<DepartmentDetail>(`/api/departments/${id}`),
  })

  useBreadcrumbLabel(id, query.data?.name)

  const assignedIds = useMemo(
    () => new Set(query.data?.members.map((member) => member.id) ?? []),
    [query.data]
  )

  const membersQuery = useQuery({
    queryKey: ["members", "department-picker", q],
    queryFn: () =>
      api<MemberList>(
        `/api/members?page=1&pageSize=50${q ? `&q=${encodeURIComponent(q)}` : ""}`
      ),
    enabled: manage,
  })

  const candidates = (membersQuery.data?.items ?? []).filter(
    (member) => !assignedIds.has(member.id) && !member.isDeleted
  )
  const eligible = candidates.filter((member) =>
    hasCompletedSod(member.soulTracker?.currentStage)
  )
  const blocked = candidates.filter(
    (member) => !hasCompletedSod(member.soulTracker?.currentStage)
  )

  const addMutation = useMutation({
    mutationFn: (memberIds: string[]) =>
      api(`/api/departments/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ memberIds }),
      }),
    onSuccess: () => {
      toast.success("Members added to the department.")
      setSelected([])
      queryClient.invalidateQueries({ queryKey: ["department", id] })
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const removeMutation = useMutation({
    mutationFn: (memberIds: string[]) =>
      api(`/api/departments/${id}/members`, {
        method: "DELETE",
        body: JSON.stringify({ memberIds }),
      }),
    onSuccess: () => {
      toast.success("Members removed from the department.")
      queryClient.invalidateQueries({ queryKey: ["department", id] })
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function toggle(memberId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, memberId]
        : current.filter((value) => value !== memberId)
    )
  }

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
        <div className="grid gap-6">
          <PageHeader
            title={query.data.name}
            description="Add or remove members. People can belong to more than one department after they complete SOD."
          />

          {manage ? (
            <div className="grid gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-end gap-2">
                <Input
                  placeholder="Search members to add"
                  className="max-w-xs"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
                <Button
                  disabled={selected.length === 0}
                  isLoading={addMutation.isPending}
                  onClick={() => addMutation.mutate(selected)}
                >
                  Add selected ({selected.length})
                </Button>
              </div>
              {eligible.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {eligible.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selected.includes(member.id)}
                        onCheckedChange={(next) =>
                          toggle(member.id, next === true)
                        }
                      />
                      <span>
                        {fullName(member.firstName, member.lastName)}
                        <span className="ml-2 text-muted-foreground">
                          {member.memberCode}
                        </span>
                      </span>
                      {member.soulTracker ? (
                        <StatusBadge value={member.soulTracker.currentStage} />
                      ) : null}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {membersQuery.isPending
                    ? "Loading members..."
                    : candidates.length
                      ? DEPARTMENT_SOD_MESSAGE
                      : "No matching members left to add."}
                </p>
              )}
              {blocked.length ? (
                <p className="text-sm text-muted-foreground">
                  {blocked.length} matching member
                  {blocked.length === 1 ? "" : "s"} cannot join until SOD is
                  completed.
                </p>
              ) : null}
            </div>
          ) : null}

          {query.data.members.length ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    {manage ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.memberCode}
                      </TableCell>
                      <TableCell>
                        {fullName(member.firstName, member.lastName)}
                      </TableCell>
                      <TableCell>
                        {member.isDeleted ? (
                          <StatusBadge value="DELETED" />
                        ) : (
                          <StatusBadge value={member.status} />
                        )}
                      </TableCell>
                      {manage ? (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            isLoading={
                              removeMutation.isPending &&
                              removeMutation.variables?.[0] === member.id
                            }
                            onClick={() => removeMutation.mutate([member.id])}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No members in this department"
              description="Search the campus directory and add one or more members."
              icon={UsersIcon}
            />
          )}
        </div>
      ) : null}
    </QuerySection>
  )
}
