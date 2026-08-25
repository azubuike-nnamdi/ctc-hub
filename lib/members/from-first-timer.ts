import { hash } from "bcryptjs"
import type { Prisma } from "@prisma/client"

import { generateTemporaryPassword } from "@/lib/auth/password"
import type { AgeRange, Chapel, SoulStage } from "@/lib/db/enums"
import { allocateMemberCode } from "@/lib/members/member-code"
import { sendMemberWelcomeEmail } from "@/lib/mail/onboarding-email"
import { getAppUrl } from "@/lib/utils/app-url"
import { hasCompletedMip } from "@/lib/utils/labels"

export type MemberWelcome = {
  to: string
  firstName: string
  temporaryPassword: string
}

export type FirstTimerPromotion = {
  memberId: string
  created: boolean
  welcome: MemberWelcome | null
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
  const appUrl = getAppUrl()
  await sendMemberWelcomeEmail({
    to: welcome.to,
    firstName: welcome.firstName,
    temporaryPassword: welcome.temporaryPassword,
    loginUrl: `${appUrl}/login`,
  })
}

export async function promoteFirstTimerIfEligible(
  tx: Prisma.TransactionClient,
  soulTrackerId: string,
  stage: SoulStage
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
      data: { status: "TREASURE_HUNT" },
    })
    return {
      memberId: existing.id,
      created: false,
      welcome: null,
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
        data: { status: "TREASURE_HUNT" },
      })
      return {
        memberId: existingUser.member.id,
        created: false,
        welcome: null,
      }
    }
    if (!existingUser) {
      const temporaryPassword = generateTemporaryPassword()
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: await hash(temporaryPassword, 12),
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
      dateJoined: firstTimer.registeredAt,
    },
  })

  await tx.soulTracker.update({
    where: { id: soulTrackerId },
    data: { memberId: member.id },
  })
  await tx.firstTimer.update({
    where: { id: firstTimer.id },
    data: { status: "TREASURE_HUNT" },
  })

  return {
    memberId: member.id,
    created: true,
    welcome,
  }
}

async function findExistingMember(
  tx: Prisma.TransactionClient,
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
