"use client"

import type { ReactNode } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartColumnIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type ChartDatum = { label: string; count: number }

export type MonthlyDatum = {
  month: string
  members: number
  firstTimers: number
}

export type DashboardAnalytics = {
  monthly: MonthlyDatum[]
  membersByChapel: ChartDatum[]
  firstTimersByStatus: ChartDatum[]
  soulsByStage: ChartDatum[]
  membersByGender: ChartDatum[]
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--card-foreground)",
  fontSize: 12,
}

function hasCounts(items: ChartDatum[]) {
  return items.some((item) => item.count > 0)
}

export function DashboardCharts({
  analytics,
}: {
  analytics?: DashboardAnalytics
}) {
  const monthly = analytics?.monthly ?? []
  const membersByChapel = analytics?.membersByChapel ?? []
  const firstTimersByStatus = analytics?.firstTimersByStatus ?? []
  const soulsByStage = analytics?.soulsByStage ?? []
  const membersByGender = analytics?.membersByGender ?? []
  const monthlyHasData = monthly.some(
    (item) => item.members > 0 || item.firstTimers > 0
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ChartCard
          title="Growth over 6 months"
          description="New members and first timers by month"
        >
          {monthlyHasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="members"
                  name="Members"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="firstTimers"
                  name="First timers"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
        <ChartCard title="Members by gender" description="Active members">
          {hasCounts(membersByGender) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membersByGender}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {membersByGender.map((item, index) => (
                    <Cell
                      key={item.label}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Members by chapel"
          description="Adult, youth, and junior"
        >
          {hasCounts(membersByChapel) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membersByChapel}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
                <Bar dataKey="count" name="Members" radius={[6, 6, 0, 0]}>
                  {membersByChapel.map((item, index) => (
                    <Cell
                      key={item.label}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
        <ChartCard
          title="First timers by status"
          description="Follow-up pipeline"
        >
          {hasCounts(firstTimersByStatus) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={firstTimersByStatus}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
                <Bar dataKey="count" name="First timers" radius={[6, 6, 0, 0]}>
                  {firstTimersByStatus.map((item, index) => (
                    <Cell
                      key={item.label}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
        <ChartCard
          title="Soul tracker stages"
          description="People currently in each stage"
          className="lg:col-span-2 xl:col-span-1"
        >
          {hasCounts(soulsByStage) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={soulsByStage} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={118}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
                <Bar dataKey="count" name="Souls" radius={[0, 6, 6, 0]}>
                  {soulsByStage.map((item, index) => (
                    <Cell
                      key={item.label}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-65 w-full">{children}</div>
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <EmptyState
      title="No data yet"
      description="This chart will fill in as records are added."
      icon={ChartColumnIcon}
      className="h-full border-0 p-0"
    />
  )
}
