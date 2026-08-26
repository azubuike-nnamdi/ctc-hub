import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FIRST_TIMER_STATUS_LABELS } from "@/lib/utils/labels"

const DUE_FILTER_LABELS = {
  ALL: "All due dates",
  OVERDUE: "Overdue",
  UNASSIGNED: "Unassigned",
  DUE_THIS_WEEK: "Due this week",
}

export function FirstTimerFilters({
  query,
  status,
  due,
  onQueryChange,
  onStatusChange,
  onDueChange,
}: {
  query: string
  status: string
  due: string
  onQueryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDueChange: (value: string) => void
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Input
        placeholder="Search visitors"
        className="max-w-xs"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <Select
        value={status}
        onValueChange={(value) => value && onStatusChange(value)}
        items={{ ALL: "All statuses", ...FIRST_TIMER_STATUS_LABELS }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="NEW">New</SelectItem>
          <SelectItem value="CONTACTED">Contacted</SelectItem>
          <SelectItem value="VISITED">Visited</SelectItem>
          <SelectItem value="RETURNED">Returned</SelectItem>
          <SelectItem value="MEMBER">Member</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={due}
        onValueChange={(value) => value && onDueChange(value)}
        items={DUE_FILTER_LABELS}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Due" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All due dates</SelectItem>
          <SelectItem value="OVERDUE">Overdue</SelectItem>
          <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
          <SelectItem value="DUE_THIS_WEEK">Due this week</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
