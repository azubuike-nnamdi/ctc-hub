"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import { useState } from "react"
import type { Member } from "@/lib/db/types"
import { can, type Role } from "@/lib/auth/rbac"

import { MemberFormSheet } from "@/components/members/member-form-sheet"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/client"

export function MemberProfile({ id, role }: { id: string; role: Role }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const query = useQuery({
    queryKey: ["member", id],
    queryFn: () => api<Member>(`/api/members/${id}`),
  })

  const deactivate = useMutation({
    mutationFn: () =>
      api(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "INACTIVE" }),
      }),
    onSuccess: () => {
      toast.success("Member deactivated.")
      queryClient.invalidateQueries({ queryKey: ["member", id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const update = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      api(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success("Member updated.")
      queryClient.invalidateQueries({ queryKey: ["member", id] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const member = query.data
  if (!member) {
    return <p className="text-sm text-muted-foreground">Loading member...</p>
  }

  const canEdit = can(role, "members:write") && role !== "USHER"

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{member.memberCode}</p>
          <h2 className="text-2xl font-semibold">
            {member.firstName} {member.lastName}
          </h2>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <Button variant="outline" onClick={() => setOpen(true)}>
              Edit
            </Button>
          ) : null}
          {canEdit && member.status === "ACTIVE" ? (
            <Button
              variant="destructive"
              onClick={() => deactivate.mutate()}
              isLoading={deactivate.isPending}
              isLoadingText="Deactivating..."
            >
              Deactivate
            </Button>
          ) : null}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" value={member.phone} />
          <Field label="Email" value={member.email ?? "—"} />
          <div>
            <p className="text-xs text-muted-foreground">Gender</p>
            <StatusBadge value={member.gender} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Chapel</p>
            <StatusBadge value={member.chapel} />
          </div>
          <Field
            label="Date of birth"
            value={
              member.dateOfBirth
                ? format(new Date(member.dateOfBirth), "MMM d, yyyy")
                : "—"
            }
          />
          <Field
            label="Date joined"
            value={format(new Date(member.dateJoined), "MMM d, yyyy")}
          />
          <Field label="Address" value={member.address ?? "—"} />
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge value={member.status} />
          </div>
        </CardContent>
      </Card>
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
          dateJoined: new Date(member.dateJoined).toISOString().slice(0, 10),
        }}
        onSubmit={async (values) => {
          await update.mutateAsync(values)
        }}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
