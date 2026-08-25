import { prisma } from "@/lib/db/prisma"
import {
  DEPARTMENT_SOD_MESSAGE,
  fullName,
  hasCompletedSod,
} from "@/lib/utils/labels"

export async function membersIneligibleForDepartment(
  memberIds: string[],
  branchId: string
) {
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds }, branchId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      soulTracker: { select: { currentStage: true } },
    },
  })
  return members.filter(
    (member) => !hasCompletedSod(member.soulTracker?.currentStage)
  )
}

export function departmentEligibilityError(
  members: Array<{ firstName: string; lastName: string }>
) {
  const names = members
    .map((member) => fullName(member.firstName, member.lastName))
    .join(", ")
  return names
    ? `${DEPARTMENT_SOD_MESSAGE} Not eligible: ${names}.`
    : DEPARTMENT_SOD_MESSAGE
}
