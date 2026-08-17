"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { format } from "date-fns"
import {
  CalendarDaysIcon,
  UserPlusIcon,
  UsersIcon,
  WaypointsIcon,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"
import { StatusBadge } from "@/components/shared/status-badge"

type DashboardData = {
  stats: {
    totalMembers: number
    firstTimers: number
    activeSoulTracker: number
    upcomingEvents: number
  }
  recentFirstTimers: Array<{
    id: string
    firstName: string
    lastName: string
    status: string
    registeredAt: string
  }>
  recentMembers: Array<{
    id: string
    firstName: string
    lastName: string
    memberCode: string
    updatedAt: string
  }>
  upcomingEventList: Array<{
    id: string
    title: string
    startsAt: string
    venue: string
    status: string
  }>
}

export function DashboardView({
  firstName,
  role,
}: {
  firstName: string
  role: Role
}) {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/api/dashboard"),
  })
  const data = query.data
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {greeting}, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Welcome back. Here is the overview for today.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Members" value={data?.stats.totalMembers ?? 0} />
        <StatCard label="First Timers" value={data?.stats.firstTimers ?? 0} />
        <StatCard label="Active Soul Tracker" value={data?.stats.activeSoulTracker ?? 0} />
        <StatCard label="Upcoming Events" value={data?.stats.upcomingEvents ?? 0} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {can(role, "members:write") ? (
          <QuickAction
            href="/members"
            label="Add Member"
            icon={UsersIcon}
          />
        ) : null}
        {can(role, "first-timers:create") ? (
          <QuickAction
            href="/first-timers"
            label="Register First Timer"
            icon={UserPlusIcon}
          />
        ) : null}
        <QuickAction
          href="/soul-tracker"
          label="Soul Tracker"
          icon={WaypointsIcon}
        />
        {can(role, "events:write") ? (
          <QuickAction
            href="/events"
            label="Create Event"
            icon={CalendarDaysIcon}
          />
        ) : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming events</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data?.upcomingEventList.length ? (
              data.upcomingEventList.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startsAt), "EEE d MMM, HH:mm")} · {event.venue}
                    </p>
                  </div>
                  <StatusBadge value={event.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent first timers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data?.recentFirstTimers.length ? (
              data.recentFirstTimers.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.registeredAt), "MMM d")}
                    </p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent visitors.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent member activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data?.recentMembers.length ? (
            data.recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <span>
                  {member.firstName} {member.lastName}{" "}
                  <span className="text-muted-foreground">({member.memberCode})</span>
                </span>
                <span className="text-muted-foreground">
                  {format(new Date(member.updatedAt), "MMM d, yyyy")}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No member activity yet.</p>
          )}
        </CardContent>
      </Card>
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
  icon: typeof UsersIcon
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
