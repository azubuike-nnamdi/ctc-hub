"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import Link from "next/link"
import { HeartHandshakeIcon, SettingsIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import type { Member, SoulWin } from "@/lib/db/types"

type MeResponse = {
  member: Member
  lastLoginAt: string | null
  stats: {
    totalSouls: number
    soulsThisMonth: number
    byEventType: {
      PERSONAL: number
      GROWTHNET: number
      WINSOME: number
    }
  }
  recentSouls: SoulWin[]
}

export function MemberDashboard({ firstName }: { firstName: string }) {
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => api<MeResponse>("/api/me"),
  })
  const data = query.data
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {greeting}, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Your souls won, last login, and recent activity.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickAction
          href="/dashboard/log-soul"
          label="Log a soul"
          icon={HeartHandshakeIcon}
        />
        <QuickAction
          href="/dashboard/settings"
          label="Update profile"
          icon={SettingsIcon}
        />
      </div>
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(query.data)}
        skeleton={<DashboardSkeleton />}
      >
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Souls won" value={data?.stats.totalSouls ?? 0} />
            <StatCard
              label="This month"
              value={data?.stats.soulsThisMonth ?? 0}
            />
            <StatCard
              label="Personal"
              value={data?.stats.byEventType.PERSONAL ?? 0}
            />
            <StatCard
              label="GrowthNet"
              value={data?.stats.byEventType.GROWTHNET ?? 0}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ActivityTile
              label="Last login"
              value={
                data?.lastLoginAt
                  ? format(new Date(data.lastLoginAt), "MMM d, yyyy, HH:mm")
                  : "Never"
              }
            />
            <ActivityTile
              label="Winsome"
              value={String(data?.stats.byEventType.WINSOME ?? 0)}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent souls</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data?.recentSouls.length ? (
                data.recentSouls.map((soul) => (
                  <div
                    key={soul.id}
                    className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {soul.firstName} {soul.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {soul.phone}
                        {soul.email ? ` · ${soul.email}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge value={soul.eventType} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(soul.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No souls logged yet"
                  description="Log a soul you won to see it here."
                  icon={HeartHandshakeIcon}
                  className="border-0 py-6"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </QuerySection>
    </div>
  )
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: typeof HeartHandshakeIcon
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      {label}
    </Link>
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

function ActivityTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-3 h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
