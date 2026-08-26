import { hash } from "bcryptjs"
import type { Prisma } from "@prisma/client"

import { generateTemporaryPassword } from "@/lib/auth/password"
import type { AgeRange, Chapel, FirstTimerStatus, SoulStage } from "@/lib/db/enums"
import type { DbClient } from "@/lib/db/prisma"
import { allocateMemberCode } from "@/lib/members/member-code"
import {
  sendFamilyWelcomeEmail,
  sendMemberWelcomeEmail,
} from "@/lib/mail/onboarding-email"
import { getAppUrl } from "@/lib/utils/app-url"
import { hasCompletedMip } from "@/lib/utils/labels"

export type MemberWelcome = {
  to: string
  firstName: string
  temporaryPassword: string | null
}

export type FirstTimerPromotion = {
  memberId: string
  created: boolean
  welcome: MemberWelcome | null
}

/**
 * Language-service Prisma.TransactionClient can lag behind generate
 * (FirstTimerStatus.MEMBER). Delegate the write through this so tsc and the IDE agree.
 */
function prismaArg<T>(value: object): T {
  return value as unknown as T
}

function becameMemberStatus(): Prisma.FirstTimerUncheckedUpdateInput {
  return prismaArg({ status: "MEMBER" satisfies FirstTimerStatus })
}

export function chapelFromAgeRange(ageRange: AgeRange | null): Chapel {
  if (ageRange === "BELOW_20") {
    return "YOUTH"
  }
  return "ADULT"
}

export function parseFirstTimerBirthday(value: string | null) {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

export async function sendMemberWelcome(welcome: MemberWelcome) {
  if (!welcome.temporaryPassword) {
    return
  }
  const appUrl = getAppUrl()
  await sendMemberWelcomeEmail({
    to: welcome.to,
    firstName: welcome.firstName,
    temporaryPassword: welcome.temporaryPassword,
    loginUrl: `${appUrl}/login`,
  })
}

export async function sendMembershipEmails(welcome: MemberWelcome) {
  await sendFamilyWelcomeEmail({
    to: welcome.to,
    firstName: welcome.firstName,
  })
  await sendMemberWelcome(welcome)
}

export async function promoteFirstTimerIfEligible(
  tx: DbClient,
  soulTrackerId: string,
  stage: SoulStage,
  options?: { joinedAt?: Date }
): Promise<FirstTimerPromotion | null> {
  if (!hasCompletedMip(stage)) {
    return null
  }

  const tracker = await tx.soulTracker.findUnique({
    where: { id: soulTrackerId },
    include: { firstTimer: true, member: { select: { id: true } } },
  })
  if (!tracker?.firstTimer || tracker.memberId) {
    return null
  }

  const firstTimer = tracker.firstTimer
  const email = firstTimer.email?.trim().toLowerCase() || null
  const existing = await findExistingMember(tx, {
    branchId: tracker.branchId,
    email,
    phone: firstTimer.phone,
    firstName: firstTimer.firstName,
    lastName: firstTimer.lastName,
  })

  if (existing) {
    if (!existing.soulTrackerId) {
      await tx.soulTracker.update({
        where: { id: soulTrackerId },
        data: { memberId: existing.id },
      })
    }
    await tx.firstTimer.update({
      where: { id: firstTimer.id },
      data: becameMemberStatus(),
    })
    return {
      memberId: existing.id,
      created: false,
      welcome: familyWelcome(firstTimer),
    }
  }

  const memberCode = await allocateMemberCode(tx, tracker.branchId)
  let userId: string | null = null
  let welcome: MemberWelcome | null = null

  if (email) {
    const existingUser = await tx.user.findUnique({
      where: { email },
      select: { id: true, role: true, member: { select: { id: true } } },
    })
    if (existingUser?.member) {
      if (!tracker.memberId) {
        const memberTracker = await tx.soulTracker.findUnique({
          where: { memberId: existingUser.member.id },
          select: { id: true },
        })
        if (!memberTracker) {
          await tx.soulTracker.update({
            where: { id: soulTrackerId },
            data: { memberId: existingUser.member.id },
          })
        }
      }
      await tx.firstTimer.update({
        where: { id: firstTimer.id },
        data: becameMemberStatus(),
      })
      return {
        memberId: existingUser.member.id,
        created: false,
        welcome: familyWelcome(firstTimer),
      }
    }
    if (!existingUser) {
      const temporaryPassword = generateTemporaryPassword()
      const passwordHash = await hash(temporaryPassword, 12)
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: firstTimer.firstName,
          lastName: firstTimer.lastName,
          role: "MEMBER",
          branchId: tracker.branchId,
          mustChangePassword: true,
          passwordResetAt: new Date(),
        },
      })
      userId = user.id
      welcome = {
        to: email,
        firstName: firstTimer.firstName,
        temporaryPassword,
      }
    } else if (existingUser.role === "MEMBER") {
      userId = existingUser.id
    }
  }

  const member = await tx.member.create({
    data: {
      branchId: tracker.branchId,
      userId,
      memberCode,
      firstName: firstTimer.firstName,
      lastName: firstTimer.lastName,
      phone: firstTimer.phone,
      email,
      gender: firstTimer.gender,
      dateOfBirth: parseFirstTimerBirthday(firstTimer.birthday),
      address: firstTimer.address,
      chapel: chapelFromAgeRange(firstTimer.ageRange),
      dateJoined: options?.joinedAt ?? firstTimer.registeredAt,
    },
  })

  await tx.soulTracker.update({
    where: { id: soulTrackerId },
    data: { memberId: member.id },
  })
  await tx.firstTimer.update({
    where: { id: firstTimer.id },
    data: becameMemberStatus(),
  })

  return {
    memberId: member.id,
    created: true,
    welcome: welcome ?? familyWelcome(firstTimer),
  }
}

async function findExistingMember(
  tx: DbClient,
  input: {
    branchId: string
    email: string | null
    phone: string
    firstName: string
    lastName: string
  }
) {
  if (input.email) {
    const byEmail = await tx.member.findFirst({
      where: {
        branchId: input.branchId,
        isDeleted: false,
        email: { equals: input.email, mode: "insensitive" },
      },
      select: { id: true, soulTracker: { select: { id: true } } },
    })
    if (byEmail) {
      return {
        id: byEmail.id,
        soulTrackerId: byEmail.soulTracker?.id ?? null,
      }
    }
  }

  const byPhone = await tx.member.findFirst({
    where: {
      branchId: input.branchId,
      isDeleted: false,
      phone: input.phone,
      firstName: { equals: input.firstName, mode: "insensitive" },
      lastName: { equals: input.lastName, mode: "insensitive" },
    },
    select: { id: true, soulTracker: { select: { id: true } } },
  })
  if (!byPhone) {
    return null
  }
  return {
    id: byPhone.id,
    soulTrackerId: byPhone.soulTracker?.id ?? null,
  }
}

function familyWelcome(firstTimer: {
  email: string | null
  firstName: string
}): MemberWelcome | null {
  const email = firstTimer.email?.trim().toLowerCase() || null
  if (!email) {
    return null
  }
  return {
    to: email,
    firstName: firstTimer.firstName,
    temporaryPassword: null,
  }
}
