import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { FirstTimerStatsResponse } from "@/components/first-timers/types"

export function FirstTimerStats({ stats }: { stats: FirstTimerStatsResponse }) {
  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total first timers" value={stats.total} />
      <StatCard label="New" value={stats.new} />
      <StatCard label="In follow-up" value={stats.inFollowUp} />
      <StatCard label="Treasure Hunt" value={stats.treasureHunt} />
      <StatCard label="Registered this month" value={stats.thisMonth} />
    </div>
  )
}

export function FirstTimerStatsSkeleton() {
  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
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
