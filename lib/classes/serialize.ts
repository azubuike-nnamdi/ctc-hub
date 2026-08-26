import { enrollmentPerson } from "@/lib/classes/enroll"

type Person = {
  id?: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

export function serializeClassSummary(record: {
  id: string
  branchId: string
  program: string
  title: string
  startsOn: Date
  status: string
  facilitatorName: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy?: { firstName: string; lastName: string }
  sessions?: Array<{ id: string; weekNumber: number; meetsOn: Date }>
  _count?: { enrollments: number }
}) {
  const sessions = record.sessions ?? []
  const last = sessions[sessions.length - 1]
  return {
    id: record.id,
    branchId: record.branchId,
    program: record.program,
    title: record.title,
    startsOn: record.startsOn.toISOString(),
    endsOn: last ? last.meetsOn.toISOString() : record.startsOn.toISOString(),
    status: record.status,
    facilitatorName: record.facilitatorName,
    createdById: record.createdById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy,
    sessionCount: sessions.length,
    enrollmentCount: record._count?.enrollments ?? 0,
    sessions: sessions.map((session) => ({
      id: session.id,
      weekNumber: session.weekNumber,
      meetsOn: session.meetsOn.toISOString(),
    })),
  }
}

export function serializeClassDetail(record: {
  id: string
  branchId: string
  program: string
  title: string
  startsOn: Date
  status: string
  facilitatorName: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy?: { firstName: string; lastName: string }
  sessions: Array<{ id: string; weekNumber: number; meetsOn: Date; createdAt?: Date }>
  enrollments: Array<{
    id: string
    classId: string
    soulTrackerId: string
    memberId: string | null
    firstTimerId: string | null
    status: string
    createdAt: Date
    updatedAt?: Date
    member?: Person | null
    firstTimer?: Person | null
    attendances: Array<{
      id: string
      enrollmentId: string
      sessionId: string
      present: boolean
      markedAt: Date
    }>
  }>
}) {
  return {
    ...serializeClassSummary({
      ...record,
      _count: { enrollments: record.enrollments.length },
    }),
    enrollments: record.enrollments.map((enrollment) => {
      const person = enrollmentPerson(enrollment)
      return {
        id: enrollment.id,
        classId: enrollment.classId,
        soulTrackerId: enrollment.soulTrackerId,
        memberId: enrollment.memberId,
        firstTimerId: enrollment.firstTimerId,
        status: enrollment.status,
        createdAt: enrollment.createdAt.toISOString(),
        person: {
          firstName: person.firstName,
          lastName: person.lastName,
          phone: person.phone,
          email: person.email,
        },
        presentCount: enrollment.attendances.filter((row) => row.present).length,
        attendances: enrollment.attendances.map((row) => ({
          id: row.id,
          sessionId: row.sessionId,
          present: row.present,
          markedAt: row.markedAt.toISOString(),
        })),
      }
    }),
  }
}
