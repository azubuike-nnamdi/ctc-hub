import { Badge } from "@/components/ui/badge"
import { SOUL_STAGE_LABELS, SOUL_WIN_EVENT_LABELS } from "@/lib/utils/labels"

const styles: Record<string, string> = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  INACTIVE: "bg-muted text-muted-foreground",
  PENDING_RESET:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  NEW: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  CONTACTED: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  VISITED:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  RETURNED:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  TREASURE_HUNT: "bg-red-50 text-[var(--brand-red)] dark:bg-red-950",
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  FIRST_TIMER: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  FOLLOW_UP: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  MISSION_IGNITION:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  WORKER_TRAINING:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  WORKER:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  LEADER: "bg-primary/10 text-primary",
  SUPER_ADMIN: "bg-primary/10 text-primary",
  ADMIN: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  PASTOR:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  USHER: "bg-muted text-muted-foreground",
  CALL: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  VISIT: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  NOTE: "bg-muted text-muted-foreground",
  ADULT: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  YOUTH: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  JUNIOR:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  MALE: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  FEMALE:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  SELF: "bg-primary/10 text-primary",
  STAFF: "bg-muted text-muted-foreground",
  MEMBER: "bg-primary/10 text-primary",
  PERSONAL: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  GROWTHNET:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  WINSOME: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  DELETED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
}

const labels: Record<string, string> = {
  ...SOUL_STAGE_LABELS,
  PENDING_RESET: "Pending reset",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PASTOR: "Pastor",
  USHER: "Usher",
  FOLLOW_UP: "Follow-up",
  TREASURE_HUNT: "Treasure Hunt",
  WORKER_TRAINING: "Worker Training",
  MISSION_IGNITION: "Mission Ignition",
  SELF: "Self",
  STAFF: "Staff",
  MEMBER: "Member",
  DELETED: "Deleted",
  ...SOUL_WIN_EVENT_LABELS,
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="secondary" className={styles[value] ?? ""}>
      {labels[value] ?? value.replaceAll("_", " ")}
    </Badge>
  )
}
