import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FIRST_TIMER_STATUS_LABELS } from "@/lib/utils/labels"

export function FirstTimerFilters({
  query,
  status,
  onQueryChange,
  onStatusChange,
}: {
  query: string
  status: string
  onQueryChange: (value: string) => void
  onStatusChange: (value: string) => void
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
          <SelectItem value="TREASURE_HUNT">Treasure Hunt</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
