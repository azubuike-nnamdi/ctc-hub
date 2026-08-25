"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import type { Department } from "@/lib/db/types"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api/client"
import { DEPARTMENT_SOD_MESSAGE } from "@/lib/utils/labels"

export function MemberDepartmentsCard({
  memberId,
  assigned,
  canEdit,
  canJoinDepartment,
}: {
  memberId: string
  assigned: Array<{ id: string; name: string }>
  canEdit: boolean
  canJoinDepartment: boolean
}) {
  const queryClient = useQueryClient()
  const assignedIds = assigned.map((item) => item.id)
  const [draft, setDraft] = useState<string[] | null>(null)
  const selected = draft ?? assignedIds

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<Department[]>("/api/departments"),
    enabled: canEdit,
  })

  const saveMutation = useMutation({
    mutationFn: (departmentIds: string[]) =>
      api(`/api/members/${memberId}/departments`, {
        method: "PATCH",
        body: JSON.stringify({ departmentIds }),
      }),
    onSuccess: () => {
      toast.success("Departments updated.")
      setDraft(null)
      queryClient.invalidateQueries({ queryKey: ["member", memberId] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
      queryClient.invalidateQueries({ queryKey: ["departments"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function toggle(id: string, checked: boolean) {
    if (checked && !canJoinDepartment && !assignedIds.includes(id)) {
      toast.error(DEPARTMENT_SOD_MESSAGE)
      return
    }
    const next = checked
      ? [...selected, id]
      : selected.filter((value) => value !== id)
    setDraft(next)
  }

  const options = canEdit ? (departmentsQuery.data ?? []) : assigned
  const unchanged =
    selected.length === assignedIds.length &&
    assignedIds.every((id) => selected.includes(id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments</CardTitle>
        <CardDescription>
          {canJoinDepartment
            ? "A member can serve in more than one department."
            : DEPARTMENT_SOD_MESSAGE}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {options.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((department) => (
              <label
                key={department.id}
                className="flex items-center gap-2 text-sm"
              >
                {canEdit ? (
                  <Checkbox
                    checked={selected.includes(department.id)}
                    disabled={
                      !canJoinDepartment &&
                      !assignedIds.includes(department.id) &&
                      !selected.includes(department.id)
                    }
                    onCheckedChange={(next) =>
                      toggle(department.id, next === true)
                    }
                  />
                ) : null}
                {department.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "No departments yet. Create them under Departments."
              : "Not assigned to a department."}
          </p>
        )}
        {canEdit ? (
          <Button
            className="w-fit"
            disabled={unchanged}
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate(selected)}
          >
            Save departments
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
