import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { FirstTimerStatsResponse } from "@/components/first-timers/types"

export function FirstTimerStats({ stats }: { stats: FirstTimerStatsResponse }) {
  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard label="Total first timers" value={stats.total} />
      <StatCard label="New" value={stats.new} />
      <StatCard label="Overdue" value={stats.overdue} />
      <StatCard label="Unassigned" value={stats.unassigned} />
      <StatCard label="Registered this month" value={stats.thisMonth} />
      <StatCard label="Now members" value={stats.becameMembers ?? 0} />
    </div>
  )
}

export function FirstTimerStatsSkeleton() {
  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
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
