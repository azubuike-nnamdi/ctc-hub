"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-label-provider"
import { EmptyState } from "@/components/shared/empty-state"
import { QuerySection } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"
import { sessionWeekLabel } from "@/lib/classes/sessions"
import type {
  DiscipleshipClassStatus,
  DiscipleshipEnrollmentStatus,
  DiscipleshipProgram,
} from "@/lib/db/enums"
import { fullName } from "@/lib/utils/labels"

type ClassDetail = {
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
  enrollments: Array<{
    id: string
    soulTrackerId: string
    status: DiscipleshipEnrollmentStatus
    person: {
      firstName: string
      lastName: string
      phone: string
      email: string | null
    }
    presentCount: number
    attendances: Array<{ sessionId: string; present: boolean }>
  }>
}

type Candidate = {
  id: string
  firstName: string
  lastName: string
  phone: string
  stageLabel: string
}

type AttendanceResponse = ClassDetail & {
  promotions?: Array<{ memberId: string }>
}

function presentByEnrollment(
  enrollments: ClassDetail["enrollments"],
  sessionId: string | null
) {
  const next: Record<string, boolean> = {}
  if (!sessionId) {
    return next
  }
  for (const enrollment of enrollments) {
    next[enrollment.id] =
      enrollment.attendances.find((row) => row.sessionId === sessionId)
        ?.present === true
  }
  return next
}

function isPresentLocked(
  program: DiscipleshipProgram,
  status: DiscipleshipEnrollmentStatus,
  canWrite: boolean,
  classLocked: boolean
) {
  return (
    !canWrite ||
    classLocked ||
    (program === "MIP" && status === "COMPLETED")
  )
}

export function ClassDetail({ id, role }: { id: string; role: Role }) {
  const queryClient = useQueryClient()
  const canWrite = can(role, "soul-tracker:write")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [completeOpen, setCompleteOpen] = useState(false)
  const [draftPresent, setDraftPresent] = useState<Record<string, boolean>>({})
  const attendanceSessionRef = useRef<string | null>(null)

  const query = useQuery({
    queryKey: ["class", id],
    queryFn: () => api<ClassDetail>(`/api/classes/${id}`),
  })
  const record = query.data
  useBreadcrumbLabel(id, record?.title ?? null)

  const activeSessionId = sessionId ?? record?.sessions[0]?.id ?? null
  const activeSession = record?.sessions.find((row) => row.id === activeSessionId)
  const locked =
    record?.status === "COMPLETED" || record?.status === "CANCELLED"

  useEffect(() => {
    if (!record || !activeSessionId) {
      return
    }
    const saved = presentByEnrollment(record.enrollments, activeSessionId)
    if (attendanceSessionRef.current !== activeSessionId) {
      attendanceSessionRef.current = activeSessionId
      setDraftPresent(saved)
      return
    }
    setDraftPresent((prev) => {
      const next = { ...saved }
      for (const id of Object.keys(prev)) {
        if (id in saved && prev[id] !== saved[id]) {
          next[id] = prev[id]
        }
      }
      return next
    })
  }, [record, activeSessionId])

  const eligibleEnrollmentIds = useMemo(() => {
    if (!record) {
      return []
    }
    return record.enrollments
      .filter(
        (enrollment) =>
          !isPresentLocked(
            record.program,
            enrollment.status,
            canWrite,
            locked
          )
      )
      .map((enrollment) => enrollment.id)
  }, [record, canWrite, locked])

  const pendingEntries = useMemo(() => {
    if (!record || !activeSessionId) {
      return []
    }
    const saved = presentByEnrollment(record.enrollments, activeSessionId)
    return eligibleEnrollmentIds
      .filter(
        (enrollmentId) =>
          (draftPresent[enrollmentId] === true) !== Boolean(saved[enrollmentId])
      )
      .map((enrollmentId) => ({
        enrollmentId,
        present: draftPresent[enrollmentId] === true,
      }))
  }, [record, activeSessionId, draftPresent, eligibleEnrollmentIds])

  const eligibleCheckedCount = eligibleEnrollmentIds.filter(
    (enrollmentId) => draftPresent[enrollmentId]
  ).length
  const allEligibleChecked =
    eligibleEnrollmentIds.length > 0 &&
    eligibleCheckedCount === eligibleEnrollmentIds.length
  const someEligibleChecked =
    eligibleCheckedCount > 0 && !allEligibleChecked
  const markingPresentOnly =
    pendingEntries.length > 0 && pendingEntries.every((entry) => entry.present)

  const candidateQuery = useQuery({
    queryKey: ["class-candidates", id, search],
    queryFn: () =>
      api<{ items: Candidate[] }>(
        `/api/classes/${id}/candidates?q=${encodeURIComponent(search)}`
      ),
    enabled: canWrite && !locked && search.trim().length >= 2,
  })

  const enrollMutation = useMutation({
    mutationFn: (soulTrackerId: string) =>
      api(`/api/classes/${id}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ soulTrackerId }),
      }),
    onSuccess: () => {
      toast.success("Added to the roster.")
      setSearch("")
      queryClient.invalidateQueries({ queryKey: ["class", id] })
      queryClient.invalidateQueries({ queryKey: ["class-candidates", id] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const attendanceMutation = useMutation({
    mutationFn: (entries: Array<{ enrollmentId: string; present: boolean }>) =>
      api<AttendanceResponse>(
        `/api/classes/${id}/sessions/${activeSessionId}/attendance`,
        {
          method: "PATCH",
          body: JSON.stringify({ entries }),
        }
      ),
    onSuccess: (data) => {
      const promoted = data.promotions?.length ?? 0
      if (promoted > 0) {
        toast.success(
          promoted === 1
            ? "Present. They are now a member."
            : `${promoted} people marked present and are now members.`
        )
      } else {
        toast.success("Attendance saved.")
      }
      const klass = data as ClassDetail
      queryClient.setQueryData(["class", id], klass)
      setDraftPresent(presentByEnrollment(klass.enrollments, activeSessionId))
      void queryClient.invalidateQueries({ queryKey: ["class", id] })
      void queryClient.invalidateQueries({ queryKey: ["classes"] })
      void queryClient.invalidateQueries({ queryKey: ["members"] })
      void queryClient.invalidateQueries({ queryKey: ["first-timers"] })
      void queryClient.invalidateQueries({ queryKey: ["soul-tracker"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const completeMutation = useMutation({
    mutationFn: () => api(`/api/classes/${id}/complete`, { method: "POST" }),
    onSuccess: () => {
      toast.success(
        record?.program === "MIP"
          ? "MIP Sunday closed. First timers marked present are members."
          : "SOD class completed."
      )
      setCompleteOpen(false)
      queryClient.invalidateQueries({ queryKey: ["class", id] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
      queryClient.invalidateQueries({ queryKey: ["soul-tracker"] })
      queryClient.invalidateQueries({ queryKey: ["first-timers"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const sessionItems = useMemo(() => {
    if (!record) return {}
    const single = record.sessions.length === 1
    return Object.fromEntries(
      record.sessions.map((session) => [
        session.id,
        sessionWeekLabel(session.weekNumber, session.meetsOn, {
          singleSession: single,
        }),
      ])
    )
  }, [record])

  return (
    <div className="grid gap-6">
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(record)}
      >
        {record ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {record.title}
                  </h2>
                  <StatusBadge value={record.program} />
                  <StatusBadge value={record.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {format(new Date(record.startsOn), "d MMM yyyy")}
                  {" – "}
                  {format(new Date(record.endsOn), "d MMM yyyy")}
                  {record.facilitatorName
                    ? ` · Facilitator ${record.facilitatorName}`
                    : ""}
                  {record.program === "MIP"
                    ? " · One Sunday for this set. Mark present to make them members."
                    : " · Members register after MIP, then mark Sunday attendance here."}
                </p>
              </div>
              {canWrite && !locked ? (
                <Button onClick={() => setCompleteOpen(true)}>
                  Complete class
                </Button>
              ) : null}
            </div>

            {canWrite && !locked ? (
              <Card>
                <CardHeader>
                  <CardTitle>Add to roster</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Input
                    placeholder={
                      record.program === "MIP"
                        ? "Search first timers or members who still need MIP"
                        : "Search members who have completed MIP"
                    }
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search.trim().length >= 2 ? (
                    candidateQuery.data?.items.length ? (
                      <ul className="divide-y rounded-lg border">
                        {candidateQuery.data.items.map((person) => (
                          <li
                            key={person.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {fullName(person.firstName, person.lastName)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {person.phone} · {person.stageLabel}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={
                                enrollMutation.isPending &&
                                enrollMutation.variables === person.id
                              }
                              onClick={() => enrollMutation.mutate(person.id)}
                            >
                              Add
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {candidateQuery.isFetching
                          ? "Searching..."
                          : "No matching people to add."}
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Type at least two letters to search.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle>Sunday attendance</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {record.sessions.length > 1 ? (
                    <Select
                      value={activeSessionId ?? undefined}
                      onValueChange={(value) => value && setSessionId(value)}
                      items={sessionItems}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {record.sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {sessionWeekLabel(session.weekNumber, session.meetsOn)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : activeSession ? (
                    <p className="text-sm text-muted-foreground">
                      {sessionWeekLabel(activeSession.weekNumber, activeSession.meetsOn, {
                        singleSession: true,
                      })}
                    </p>
                  ) : null}
                  {canWrite && !locked && pendingEntries.length > 0 ? (
                    <Button
                      size="sm"
                      isLoading={attendanceMutation.isPending}
                      isLoadingText="Saving..."
                      onClick={() => attendanceMutation.mutate(pendingEntries)}
                    >
                      {markingPresentOnly
                        ? pendingEntries.length === 1
                          ? "Mark present"
                          : `Mark ${pendingEntries.length} present`
                        : "Save attendance"}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {record.enrollments.length && activeSession ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            {canWrite && !locked ? (
                              <Checkbox
                                checked={allEligibleChecked}
                                indeterminate={someEligibleChecked}
                                disabled={
                                  eligibleEnrollmentIds.length === 0 ||
                                  attendanceMutation.isPending
                                }
                                onCheckedChange={(next) => {
                                  const present = next === true
                                  setDraftPresent((prev) => {
                                    const updated = { ...prev }
                                    for (const enrollmentId of eligibleEnrollmentIds) {
                                      updated[enrollmentId] = present
                                    }
                                    return updated
                                  })
                                }}
                                aria-label="Select all present"
                              />
                            ) : null}
                            Present
                          </div>
                        </TableHead>
                        {record.program === "SOD" ? (
                          <TableHead>Sundays</TableHead>
                        ) : (
                          <TableHead>Member</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {record.enrollments.map((enrollment) => {
                        const rowLocked = isPresentLocked(
                          record.program,
                          enrollment.status,
                          canWrite,
                          locked
                        )
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell>
                              <Link
                                href={`/admin/soul-tracker/${enrollment.soulTrackerId}`}
                                className="font-medium hover:underline"
                              >
                                {fullName(
                                  enrollment.person.firstName,
                                  enrollment.person.lastName
                                )}
                              </Link>
                            </TableCell>
                            <TableCell>{enrollment.person.phone}</TableCell>
                            <TableCell>
                              <Checkbox
                                checked={draftPresent[enrollment.id] === true}
                                disabled={rowLocked || attendanceMutation.isPending}
                                onCheckedChange={(next) =>
                                  setDraftPresent((prev) => ({
                                    ...prev,
                                    [enrollment.id]: next === true,
                                  }))
                                }
                                aria-label={`Present on ${sessionWeekLabel(activeSession.weekNumber, activeSession.meetsOn, { singleSession: record.sessions.length === 1 })}`}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {record.program === "MIP"
                                ? enrollment.status === "COMPLETED"
                                  ? "Yes"
                                  : "—"
                                : `${enrollment.presentCount}/${record.sessionCount}`}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    title="No one on the roster yet"
                    description={
                      record.program === "MIP"
                        ? "Add first timers for this Sunday. Mark present and they become members."
                        : "Members who completed MIP can register from their dashboard, or you can add them here."
                    }
                  />
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </QuerySection>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete this class?</DialogTitle>
            <DialogDescription>
              {record?.program === "MIP"
                ? "Closes this Sunday's set. People marked present are already members. Anyone not present stays a first timer and can join the next MIP."
                : "Everyone still registered will be marked SOD completed."}{" "}
              This cannot be undone from the journey dropdown.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button
              isLoading={completeMutation.isPending}
              isLoadingText="Completing..."
              onClick={() => completeMutation.mutate()}
            >
              Complete class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
