"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { Member } from "@/lib/db/types"

import { UsersIcon } from "lucide-react"

import { MemberFormSheet } from "@/components/members/member-form-sheet"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection, TableSkeleton } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import { can, type Role } from "@/lib/auth/rbac"

type ListResponse = {
  items: Member[]
  total: number
  page: number
  pageSize: number
}

type StatsResponse = {
  total: number
  active: number
  inactive: number
  deleted: number
}

export function MembersView({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState("")
  const [chapel, setChapel] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [gender, setGender] = useState("ALL")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page), pageSize: "10" })
    if (q) search.set("q", q)
    if (chapel !== "ALL") search.set("chapel", chapel)
    if (status !== "ALL") search.set("status", status)
    if (gender !== "ALL") search.set("gender", gender)
    return search.toString()
  }, [q, chapel, status, gender, page])

  const statsQuery = useQuery({
    queryKey: ["members", "stats"],
    queryFn: () => api<StatsResponse>("/api/members/stats"),
  })

  const query = useQuery({
    queryKey: ["members", params],
    queryFn: () => api<ListResponse>(`/api/members?${params}`),
  })

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      api("/api/members", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success("Invitation email sent with a temporary password.")
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div>
      <PageHeader
        title="Members"
        description="Search, filter, and manage church members."
        action={
          can(role, "members:write")
            ? { label: "Invite member", onClick: () => setOpen(true) }
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
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total members" value={statsQuery.data?.total ?? 0} />
          <StatCard
            label="Active members"
            value={statsQuery.data?.active ?? 0}
          />
          <StatCard
            label="Inactive members"
            value={statsQuery.data?.inactive ?? 0}
          />
          <StatCard
            label="Deleted members"
            value={statsQuery.data?.deleted ?? 0}
          />
        </div>
      </QuerySection>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search name, phone, or ID"
          className="max-w-xs"
          value={q}
          onChange={(event) => {
            setPage(1)
            setQ(event.target.value)
          }}
        />
        <Select
          value={chapel}
          onValueChange={(value) => value && setChapel(value)}
          items={{
            ALL: "All chapels",
            ADULT: "Adult",
            YOUTH: "Youth",
            JUNIOR: "Junior",
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Chapel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All chapels</SelectItem>
            <SelectItem value="ADULT">Adult</SelectItem>
            <SelectItem value="YOUTH">Youth</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => value && setStatus(value)}
          items={{
            ALL: "All statuses",
            ACTIVE: "Active",
            INACTIVE: "Inactive",
            DELETED: "Deleted",
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={gender}
          onValueChange={(value) => value && setGender(value)}
          items={{
            ALL: "All genders",
            MALE: "Male",
            FEMALE: "Female",
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All genders</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
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
        skeleton={<TableSkeleton columns={6} />}
      >
        {query.data?.items.length ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Chapel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.memberCode}
                    </TableCell>
                    <TableCell>
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      <StatusBadge value={member.chapel} />
                    </TableCell>
                    <TableCell>
                      {member.isDeleted ? (
                        <StatusBadge value="DELETED" />
                      ) : (
                        <StatusBadge value={member.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/admin/members/${member.id}`} />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
              <span>
                {(query.data.page - 1) * query.data.pageSize + 1}-
                {Math.min(
                  query.data.page * query.data.pageSize,
                  query.data.total
                )}{" "}
                of {query.data.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 10 >= query.data.total}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No members yet"
            description="Invite a member to start building the campus directory."
            icon={UsersIcon}
          />
        )}
      </QuerySection>
      <MemberFormSheet
        open={open}
        onOpenChange={setOpen}
        title="Invite member"
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values)
        }}
      />
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
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
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
