"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2Icon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import type { Department } from "@/lib/db/types"

import { DepartmentFormDialog } from "@/components/departments/department-form-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection } from "@/components/shared/query-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"

function canManage(role: Role) {
  return can(role, "members:write") && role !== "USHER"
}

export function DepartmentsView({ role }: { role: Role }) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState<Department | null>(null)

  const query = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<Department[]>("/api/departments"),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api("/api/departments", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success("Department created.")
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      setCreateOpen(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api(`/api/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success("Department updated.")
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      setEditing(null)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Department deleted.")
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      setDeleting(null)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const manage = canManage(role)

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Create campus teams and assign members to one or more departments."
        action={
          manage
            ? { label: "New department", onClick: () => setCreateOpen(true) }
            : undefined
        }
      />
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(query.data)}
      >
        {query.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.map((department) => (
              <Card key={department.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>{department.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {department.memberCount ?? 0}{" "}
                      {(department.memberCount ?? 0) === 1
                        ? "member"
                        : "members"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link href={`/admin/departments/${department.id}`} />
                    }
                  >
                    Manage members
                  </Button>
                  {manage ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(department)}
                      >
                        Rename
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(department)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No departments yet"
            description="Add departments such as Media, Ushers, or Choir, then assign members."
            icon={Building2Icon}
          >
            {manage ? (
              <Button onClick={() => setCreateOpen(true)}>
                New department
              </Button>
            ) : null}
          </EmptyState>
        )}
      </QuerySection>

      <DepartmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New department"
        description="Name a department for this campus."
        submitLabel="Create"
        isPending={createMutation.isPending}
        onSubmit={async (name) => {
          await createMutation.mutateAsync(name)
        }}
      />
      {editing ? (
        <DepartmentFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          title="Rename department"
          description="This name is shown on member profiles."
          initialName={editing.name}
          submitLabel="Save"
          isPending={updateMutation.isPending}
          onSubmit={async (name) => {
            await updateMutation.mutateAsync({ id: editing.id, name })
          }}
        />
      ) : null}
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              Members stay in the directory. They are only removed from this
              department.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
