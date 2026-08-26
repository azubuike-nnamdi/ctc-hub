"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { GraduationCapIcon } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { sessionWeekLabel } from "@/lib/classes/sessions"
import type {
  DiscipleshipClassStatus,
  DiscipleshipEnrollmentStatus,
  DiscipleshipProgram,
  SoulStage,
} from "@/lib/db/enums"

type ClassSummary = {
  id: string
  program: DiscipleshipProgram
  title: string
  startsOn: string
  endsOn: string
  status: DiscipleshipClassStatus
  facilitatorName: string | null
  sessionCount: number
  enrollmentCount: number
  sessions: Array<{ id: string; weekNumber: number; meetsOn: string }>
}

type MeClasses = {
  member: {
    firstName: string
    lastName: string
    email: string | null
    phone: string
  }
  currentStage: SoulStage | null
  canRegister: boolean
  blockReason: string | null
  openSodClasses: ClassSummary[]
  enrollments: Array<{
    id: string
    status: DiscipleshipEnrollmentStatus
    class: ClassSummary
    attendances: Array<{ sessionId: string; present: boolean }>
  }>
}

export function MemberClassesView() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["me-classes"],
    queryFn: () => api<MeClasses>("/api/me/classes"),
  })
  const data = query.data

  const registerMutation = useMutation({
    mutationFn: (classId: string) =>
      api("/api/me/classes", {
        method: "POST",
        body: JSON.stringify({ classId }),
      }),
    onSuccess: () => {
      toast.success("You are registered for SOD.")
      queryClient.invalidateQueries({ queryKey: ["me-classes"] })
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const activeSod = data?.enrollments.find(
    (row) =>
      row.class.program === "SOD" &&
      (row.status === "REGISTERED" || row.class.status !== "CANCELLED")
  )

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Register for SOD with your member profile after MIP. Staff mark attendance each Sunday."
      />
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(data)}
      >
        {data ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your registration details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1 text-sm">
                <p>
                  {data.member.firstName} {data.member.lastName}
                </p>
                <p className="text-muted-foreground">{data.member.phone}</p>
                <p className="text-muted-foreground">
                  {data.member.email ?? "No email on your profile"}
                </p>
                {data.currentStage ? (
                  <div className="pt-2">
                    <StatusBadge value={data.currentStage} />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {activeSod ? (
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle>{activeSod.class.title}</CardTitle>
                  <StatusBadge value={activeSod.status} />
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activeSod.class.startsOn), "d MMM yyyy")}
                    {" – "}
                    {format(new Date(activeSod.class.endsOn), "d MMM yyyy")}
                    {activeSod.class.facilitatorName
                      ? ` · ${activeSod.class.facilitatorName}`
                      : ""}
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sunday</TableHead>
                        <TableHead>Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSod.class.sessions.map((session) => {
                        const marked = activeSod.attendances.find(
                          (row) => row.sessionId === session.id
                        )
                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              {sessionWeekLabel(session.weekNumber, session.meetsOn)}
                            </TableCell>
                            <TableCell>
                              {marked
                                ? marked.present
                                  ? "Present"
                                  : "Absent"
                                : "Not marked yet"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}

            {data.canRegister && data.openSodClasses.length ? (
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Register for SOD</h3>
                {data.openSodClasses.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <StatusBadge value={item.status} />
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm text-muted-foreground">
                      <p>
                        8 Sundays ·{" "}
                        {format(new Date(item.startsOn), "d MMM yyyy")}
                        {" – "}
                        {format(new Date(item.endsOn), "d MMM yyyy")}
                      </p>
                      <p>
                        We will use {data.member.firstName} {data.member.lastName}
                        , {data.member.phone}
                        {data.member.email ? `, ${data.member.email}` : ""} from
                        your profile.
                      </p>
                      <Button
                        className="w-fit"
                        isLoading={
                          registerMutation.isPending &&
                          registerMutation.variables === item.id
                        }
                        isLoadingText="Registering..."
                        onClick={() => registerMutation.mutate(item.id)}
                      >
                        Register for SOD
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !activeSod ? (
              <EmptyState
                title={data.blockReason ? "Not eligible for SOD yet" : "No SOD class announced"}
                description={
                  data.blockReason ??
                  "When a SOD class is announced, you can register here with your member profile."
                }
                icon={GraduationCapIcon}
              />
            ) : null}
          </div>
        ) : null}
      </QuerySection>
    </div>
  )
}
