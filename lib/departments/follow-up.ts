import { emptyToNull, HttpError } from "@/lib/api/errors"
import { prisma } from "@/lib/db/prisma"

export type FollowUpUser = {
  id: string
  firstName: string
  lastName: string
  departments: string[]
}

export function isFollowUpDepartmentName(name: string) {
  const normalized = name.trim().toLowerCase()
  return (
    /\bfollow[\s-]*up\b/.test(normalized) || /\bmissions?\b/.test(normalized)
  )
}

export async function followUpDepartmentIds(branchId: string) {
  const departments = await prisma.department.findMany({
    where: { branchId },
    select: { id: true, name: true },
  })
  return departments
    .filter((department) => isFollowUpDepartmentName(department.name))
    .map((department) => department.id)
}

export async function memberCanFollowUp(memberId: string) {
  const memberships = await prisma.memberDepartment.findMany({
    where: { memberId },
    select: { department: { select: { name: true } } },
  })
  return memberships.some((item) =>
    isFollowUpDepartmentName(item.department.name)
  )
}

export async function findFollowUpUsers(
  branchId: string
): Promise<FollowUpUser[]> {
  const departmentIds = await followUpDepartmentIds(branchId)
  if (departmentIds.length === 0) {
    return []
  }

  const memberships = await prisma.memberDepartment.findMany({
    where: {
      departmentId: { in: departmentIds },
      member: {
        branchId,
        isDeleted: false,
        status: "ACTIVE",
        userId: { not: null },
        user: { isActive: true },
      },
    },
    select: {
      department: { select: { name: true } },
      member: {
        select: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  })

  const byUser = new Map<string, FollowUpUser>()
  for (const row of memberships) {
    const user = row.member.user
    if (!user) {
      continue
    }
    const existing = byUser.get(user.id)
    if (existing) {
      if (!existing.departments.includes(row.department.name)) {
        existing.departments.push(row.department.name)
      }
      continue
    }
    byUser.set(user.id, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      departments: [row.department.name],
    })
  }

  return [...byUser.values()].sort((a, b) =>
    a.firstName.localeCompare(b.firstName)
  )
}

export async function assertFollowUpAssignee(
  userId: string | null | undefined,
  branchId: string
) {
  const id = emptyToNull(userId)
  if (!id) {
    return
  }

  const users = await findFollowUpUsers(branchId)
  if (!users.some((user) => user.id === id)) {
    throw new HttpError(
      "Assign follow-up to someone in Mission or Follow-up.",
      400
    )
  }
}
