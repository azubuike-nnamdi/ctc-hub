"use client"

import { ErrorState } from "@/components/shared/error-state"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FOLLOW_UP_ASSIGNEE_HINT } from "@/lib/utils/labels"

export type FollowUpAssigneeOption = {
  id: string
  firstName: string
  lastName: string
  departments?: string[]
}

export function FollowUpAssigneeSelect({
  value,
  options,
  isPending,
  isError,
  error,
  isRetrying,
  onRetry,
  onChange,
}: {
  value: string | null
  options: FollowUpAssigneeOption[]
  isPending: boolean
  isError: boolean
  error?: Error | null
  isRetrying?: boolean
  onRetry: () => void
  onChange: (
    assignedToId: string,
    person: FollowUpAssigneeOption | null
  ) => void
}) {
  const items = [
    { value: "NONE", label: "Unassigned" },
    ...options.map((person) => ({
      value: person.id,
      label: assigneeLabel(person),
    })),
  ]

  return (
    <div className="grid gap-1.5">
      <Label>Assigned follow-up person</Label>
      {isPending ? (
        <p className="text-sm text-muted-foreground">
          Loading follow-up team...
        </p>
      ) : isError ? (
        <ErrorState
          compact
          title="Could not load follow-up team."
          description={error?.message}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <>
          <Select
            value={value || "NONE"}
            onValueChange={(next) => {
              if (!next) return
              const assignedToId = next === "NONE" ? "" : next
              const person =
                options.find((item) => item.id === assignedToId) ?? null
              onChange(assignedToId, person)
            }}
            items={items}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Unassigned</SelectItem>
              {options.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {assigneeLabel(person)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {FOLLOW_UP_ASSIGNEE_HINT}
          </p>
        </>
      )}
    </div>
  )
}

function assigneeLabel(person: FollowUpAssigneeOption) {
  const name = `${person.firstName} ${person.lastName}`
  if (!person.departments?.length) {
    return name
  }
  return `${name} (${person.departments.join(", ")})`
}
