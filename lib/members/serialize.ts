import { serializeFollowUpActivity } from "@/lib/follow-up/log-activity"
import { SOUL_STAGE, type SoulStage } from "@/lib/db/enums"
import type { Member } from "@/lib/db/types"

export const memberListInclude = {
  departments: {
    include: { department: { select: { id: true, name: true } } },
    orderBy: { department: { name: "asc" as const } },
  },
  soulTracker: { select: { id: true, currentStage: true } },
}

export const memberDetailInclude = {
  ...memberListInclude,
  deletedBy: { select: { firstName: true, lastName: true } },
  soulTracker: {
    select: {
      id: true,
      currentStage: true,
      activities: {
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { contactedAt: "desc" as const },
        take: 50,
      },
    },
  },
}

type MemberDepartmentRow = { department: { id: string; name: string } }

type MemberInput = {
  id: string
  memberCode: string
  branchId: string
  userId: string | null
  firstName: string
  lastName: string
  phone: string
  email: string | null
  gender: string
  dateOfBirth: Date | null
  address: string | null
  chapel: string
  dateJoined: Date
  status: string
  photoUrl: string | null
  isDeleted: boolean
  deletedAt: Date | null
  deletedById: string | null
  createdAt: Date
  updatedAt: Date
  deletedBy?: { firstName: string; lastName: string } | null
  departments?: unknown
  soulTracker?: {
    id: string
    currentStage: unknown
    activities?: Array<{
      id: string
      type: string
      note: string
      createdAt: Date | string
      contactedAt?: Date | string
      wouldWorshipAgain?: boolean | null
      createdBy: { firstName: string; lastName: string }
    }>
  } | null
}

function departmentRows(value: unknown): MemberDepartmentRow[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is MemberDepartmentRow => {
    if (!item || typeof item !== "object" || !("department" in item)) {
      return false
    }
    const department = item.department
    return (
      Boolean(department) &&
      typeof department === "object" &&
      "id" in department &&
      "name" in department &&
      typeof department.id === "string" &&
      typeof department.name === "string"
    )
  })
}

export function serializeMember(member: MemberInput): Member {
  return {
    id: member.id,
    memberCode: member.memberCode,
    branchId: member.branchId,
    userId: member.userId,
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    email: member.email,
    gender: member.gender as Member["gender"],
    dateOfBirth: member.dateOfBirth?.toISOString() ?? null,
    address: member.address,
    chapel: member.chapel as Member["chapel"],
    dateJoined: member.dateJoined.toISOString(),
    status: member.status as Member["status"],
    photoUrl: member.photoUrl,
    isDeleted: member.isDeleted,
    deletedAt: member.deletedAt?.toISOString() ?? null,
    deletedById: member.deletedById,
    deletedBy: member.deletedBy ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
    departments: departmentRows(member.departments).map(
      (item) => item.department
    ),
    soulTracker: member.soulTracker
      ? {
          id: member.soulTracker.id,
          currentStage: member.soulTracker.currentStage as SoulStage,
          activities: member.soulTracker.activities?.map((activity) =>
            serializeFollowUpActivity(activity)
          ),
        }
      : null,
  }
}

export function memberSoulTrackerCreate(branchId: string) {
  return {
    branchId,
    currentStage: SOUL_STAGE.MIP_COMPLETED,
    stages: {
      create: {
        stage: SOUL_STAGE.MIP_COMPLETED,
        note: "Member signup completed MIP",
      },
    },
  }
}
