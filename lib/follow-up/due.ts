import {
  addDays,
  addHours,
  endOfWeek,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns"
import type { Prisma, PrismaClient } from "@prisma/client"

export const FIRST_CONTACT_HOURS = 48
export const DEFAULT_NEXT_CONTACT_DAYS = 7

export type FollowUpDueFilter = "OVERDUE" | "UNASSIGNED" | "DUE_THIS_WEEK"
export type FollowUpDueState = "overdue" | "due-today" | "upcoming" | "closed"

type Db = PrismaClient | Prisma.TransactionClient

function prismaArg<T>(value: object): T {
  return value as unknown as T
}

export function firstContactDueAt(from = new Date()) {
  return addHours(from, FIRST_CONTACT_HOURS)
}

export function defaultNextContactAt(from = new Date()) {
  return addDays(from, DEFAULT_NEXT_CONTACT_DAYS)
}

export function parseOptionalDate(value?: string | null) {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

export function serializeNextContactAt(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

export function dueDateFrom(tracker: object | null | undefined) {
  if (!tracker || !("nextContactAt" in tracker) || tracker.nextContactAt == null) {
    return null
  }
  const value = tracker.nextContactAt
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  return parseOptionalDate(String(value))
}

export function dueFromTracker(tracker: object | null | undefined) {
  return serializeNextContactAt(dueDateFrom(tracker))
}

export function followUpDueState(
  nextContactAt: Date | string | null | undefined,
  now = new Date()
): FollowUpDueState {
  if (!nextContactAt) {
    return "closed"
  }
  const due = nextContactAt instanceof Date ? nextContactAt : new Date(nextContactAt)
  if (Number.isNaN(due.getTime())) {
    return "closed"
  }
  if (startOfDay(due) < startOfDay(now)) {
    return "overdue"
  }
  if (isToday(due)) {
    return "due-today"
  }
  return "upcoming"
}

export function toFirstTimerWhere(value: object): Prisma.FirstTimerWhereInput {
  return prismaArg(value)
}

export function notConvertedFirstTimerWhere(): Prisma.FirstTimerWhereInput {
  return prismaArg({ status: { not: "MEMBER" } })
}

export function firstTimerDueOrderBy(): Prisma.FirstTimerOrderByWithRelationInput[] {
  return prismaArg([
    { soulTracker: { nextContactAt: { sort: "asc", nulls: "last" } } },
    { registeredAt: "desc" },
  ])
}

export function soulTrackerDueOrderBy(): Prisma.SoulTrackerOrderByWithRelationInput[] {
  return prismaArg([
    { nextContactAt: { sort: "asc", nulls: "last" } },
    { updatedAt: "desc" },
  ])
}

export function firstContactDueFields(from = new Date()) {
  return { nextContactAt: firstContactDueAt(from) }
}

export async function setNextContactAt(
  db: Db,
  soulTrackerId: string,
  nextContactAt: Date | null
) {
  return db.soulTracker.update({
    where: { id: soulTrackerId },
    data: prismaArg<Prisma.SoulTrackerUncheckedUpdateInput>({ nextContactAt }),
  })
}

export async function scheduleAfterActivity(
  db: Db,
  soulTrackerId: string,
  input: { closeFollowUp?: boolean; nextContactAt?: string | null }
) {
  if (input.closeFollowUp) {
    return setNextContactAt(db, soulTrackerId, null)
  }
  return setNextContactAt(
    db,
    soulTrackerId,
    parseOptionalDate(input.nextContactAt) ?? defaultNextContactAt()
  )
}

export async function syncFollowUpAssignment(
  db: Db,
  soulTrackerId: string,
  assignedToId: string | null,
  existingNextContactAt: Date | null
) {
  return db.soulTracker.update({
    where: { id: soulTrackerId },
    data: prismaArg<Prisma.SoulTrackerUncheckedUpdateInput>({
      assignedToId,
      nextContactAt:
        assignedToId && !existingNextContactAt
          ? firstContactDueAt()
          : existingNextContactAt,
    }),
  })
}

export async function syncFirstTimerFollowUpAssignment(
  db: Db,
  firstTimerId: string,
  assignedToId: string | null
) {
  const tracker = await db.soulTracker.findFirst({
    where: { firstTimerId },
  })
  if (!tracker) {
    return
  }
  await syncFollowUpAssignment(
    db,
    tracker.id,
    assignedToId,
    dueDateFrom(tracker)
  )
}

export function isSystemMemberStatusChange(
  existing: string,
  next: string | undefined
) {
  return next === "MEMBER" && existing !== "MEMBER"
}

export function firstTimerDueWhere(
  due: FollowUpDueFilter | undefined,
  now = new Date()
): Prisma.FirstTimerWhereInput {
  if (due === "OVERDUE") {
    return prismaArg({ soulTracker: { is: { nextContactAt: { lt: now } } } })
  }
  if (due === "UNASSIGNED") {
    return prismaArg({
      assignedToId: null,
      ...notConvertedFirstTimerWhere(),
    })
  }
  if (due === "DUE_THIS_WEEK") {
    return prismaArg({
      soulTracker: {
        is: {
          nextContactAt: {
            gte: startOfWeek(now),
            lte: endOfWeek(now),
          },
        },
      },
    })
  }
  return {}
}
