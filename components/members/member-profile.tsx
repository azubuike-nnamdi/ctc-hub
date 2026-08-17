"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import { useState, type ReactNode } from "react"
import type { Member } from "@/lib/db/types"
import { can, type Role } from "@/lib/auth/rbac"

import { MemberFormSheet } from "@/components/members/member-form-sheet"
import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-label-provider"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api/client"
import { fullName, initials } from "@/lib/utils/labels"

export function MemberProfile({ id, role }: { id: string; role: Role }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const query = useQuery({
    queryKey: ["member", id],
    queryFn: () => api<Member>(`/api/members/${id}`),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["member", id] })
    queryClient.invalidateQueries({ queryKey: ["members"] })
  }

  const deactivate = useMutation({
    mutationFn: () =>
      api(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "INACTIVE" }),
      }),
    onSuccess: () => {
      toast.success("Member deactivated.")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const activate = useMutation({
    mutationFn: () =>
      api(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      }),
    onSuccess: () => {
      toast.success("Member activated.")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const restore = useMutation({
    mutationFn: () =>
      api(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ restore: true }),
      }),
    onSuccess: () => {
      toast.success("Member restored.")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: () => api(`/api/members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Member deleted.")
      setDeleteOpen(false)
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const update = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      api(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Member updated.")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const member = query.data
  const canEdit = can(role, "members:write") && role !== "USHER"

  useBreadcrumbLabel(
    id,
    member ? fullName(member.firstName, member.lastName) : undefined
  )

  return (
    <QuerySection
      isPending={query.isPending}
      isError={query.isError}
      isFetching={query.isFetching}
      error={query.error}
      onRetry={() => query.refetch()}
      hasData={Boolean(query.data)}
    >
      {member ? (
        <div>
          <PageHeader
            title={fullName(member.firstName, member.lastName)}
            description={member.memberCode}
            extra={
              canEdit ? (
                <>
                  {member.isDeleted ? (
                    <Button
                      onClick={() => restore.mutate()}
                      isLoading={restore.isPending}
                      isLoadingText="Restoring..."
                    >
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setOpen(true)}>
                        Edit
                      </Button>
                      {member.status === "ACTIVE" ? (
                        <Button
                          variant="outline"
                          onClick={() => deactivate.mutate()}
                          isLoading={deactivate.isPending}
                          isLoadingText="Deactivating..."
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          onClick={() => activate.mutate()}
                          isLoading={activate.isPending}
                          isLoadingText="Activating..."
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </>
              ) : undefined
            }
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    {member.photoUrl ? (
                      <AvatarImage src={member.photoUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>
                      {fullName(member.firstName, member.lastName)}
                    </CardTitle>
                    <CardDescription>{member.memberCode}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {member.isDeleted ? (
                    <StatusBadge value="DELETED" />
                  ) : (
                    <StatusBadge value={member.status} />
                  )}
                  <StatusBadge value={member.chapel} />
                  <StatusBadge value={member.gender} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Contact and membership details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailTile label="Phone">{member.phone}</DetailTile>
                  <DetailTile label="Email">{member.email ?? "—"}</DetailTile>
                  <DetailTile label="Gender">
                    <StatusBadge value={member.gender} />
                  </DetailTile>
                  <DetailTile label="Chapel">
                    <StatusBadge value={member.chapel} />
                  </DetailTile>
                  <DetailTile label="Date of birth">
                    {member.dateOfBirth
                      ? format(new Date(member.dateOfBirth), "MMM d, yyyy")
                      : "—"}
                  </DetailTile>
                  <DetailTile label="Date joined">
                    {format(new Date(member.dateJoined), "MMM d, yyyy")}
                  </DetailTile>
                  <DetailTile label="Address">
                    {member.address ?? "—"}
                  </DetailTile>
                  <DetailTile label="Status">
                    {member.isDeleted ? (
                      <StatusBadge value="DELETED" />
                    ) : (
                      <StatusBadge value={member.status} />
                    )}
                  </DetailTile>
                  {member.isDeleted ? (
                    <>
                      <DetailTile label="Deleted by">
                        {member.deletedBy
                          ? fullName(
                              member.deletedBy.firstName,
                              member.deletedBy.lastName
                            )
                          : "—"}
                      </DetailTile>
                      <DetailTile label="Deleted on">
                        {member.deletedAt
                          ? format(
                              new Date(member.deletedAt),
                              "MMM d, yyyy, HH:mm"
                            )
                          : "—"}
                      </DetailTile>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <MemberFormSheet
            open={open}
            onOpenChange={setOpen}
            title="Edit member"
            defaultValues={{
              ...member,
              email: member.email ?? "",
              address: member.address ?? "",
              photoUrl: member.photoUrl ?? "",
              dateOfBirth: member.dateOfBirth
                ? new Date(member.dateOfBirth).toISOString().slice(0, 10)
                : "",
              dateJoined: new Date(member.dateJoined)
                .toISOString()
                .slice(0, 10),
            }}
            onSubmit={async (values) => {
              await update.mutateAsync(values)
            }}
          />

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this member?</DialogTitle>
                <DialogDescription>
                  This is a soft delete. They will not be able to sign in, and
                  they will be asked to contact support. You can restore the
                  account later.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={remove.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => remove.mutate()}
                  isLoading={remove.isPending}
                  isLoadingText="Deleting..."
                >
                  Delete member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </QuerySection>
  )
}

function DetailTile({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  )
}
