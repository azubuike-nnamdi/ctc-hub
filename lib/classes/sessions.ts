import { format } from "date-fns"
import { HttpError } from "@/lib/api/errors"
import type { DiscipleshipProgram } from "@/lib/db/enums"

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function classSessionCount(program: DiscipleshipProgram) {
  return program === "MIP" ? 1 : 8
}

export function classSessionGapDays() {
  return 7
}

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    throw new HttpError("Pick the first Sunday as a date.", 400)
  }
  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
      0,
      0
    )
  )
}

export function utcNoon(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)
  )
}

export function sundayOnOrAfter(date: Date) {
  const noon = utcNoon(date)
  const add = noon.getUTCDay() === 0 ? 0 : 7 - noon.getUTCDay()
  return new Date(noon.getTime() + add * MS_PER_DAY)
}

export function buildClassSessions(program: DiscipleshipProgram, firstSunday: Date) {
  const count = classSessionCount(program)
  const gap = classSessionGapDays()
  const start = sundayOnOrAfter(firstSunday)
  return Array.from({ length: count }, (_, index) => ({
    weekNumber: index + 1,
    meetsOn: new Date(start.getTime() + index * gap * MS_PER_DAY),
  }))
}

export function defaultClassTitle(program: DiscipleshipProgram, firstSunday: Date) {
  const start = sundayOnOrAfter(firstSunday)
  if (program === "MIP") {
    return `MIP · ${format(start, "d MMM yyyy")}`
  }
  return `SOD · ${format(start, "d MMM yyyy")}`
}

export function sessionWeekLabel(
  weekNumber: number,
  meetsOn: Date | string,
  options?: { singleSession?: boolean }
) {
  const date = format(new Date(meetsOn), "d MMM yyyy")
  if (options?.singleSession) {
    return `Sunday · ${date}`
  }
  return `Sunday ${weekNumber} · ${date}`
}
