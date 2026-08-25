import { hash } from "bcryptjs"

import { emptyToNull, MemberInviteError } from "@/lib/api/errors"
import { generateTemporaryPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db/prisma"
import { sendMemberWelcome } from "@/lib/members/from-first-timer"
import { allocateMemberCode } from "@/lib/members/member-code"
import { memberSoulTrackerCreate } from "@/lib/members/serialize"
import type { memberSchema } from "@/lib/validation/schemas"
import type { z } from "zod"

type MemberValues = z.infer<typeof memberSchema>

export async function inviteMember({
  branchId,
  data,
}: {
  branchId: string
  data: MemberValues
}) {
  const email = data.email.toLowerCase()

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existingUser) {
    throw new MemberInviteError("A user with that email already exists.", 409)
  }

  const existingMember = await prisma.member.findFirst({
    where: { email, branchId },
    select: { id: true },
  })
  if (existingMember) {
    throw new MemberInviteError(
      "A member with that email already exists in this campus.",
      409
    )
  }

  const firstTimer = await findMatchingFirstTimer(branchId, {
    email,
    phone: data.phone,
    firstName: data.firstName,
    lastName: data.lastName,
  })
  const reusableTrackerId =
    firstTimer?.soulTracker && !firstTimer.soulTracker.memberId
      ? firstTimer.soulTracker.id
      : null

  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await hash(temporaryPassword, 12)

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "MEMBER",
        branchId,
        mustChangePassword: true,
        passwordResetAt: new Date(),
      },
    })

    const memberCode = await allocateMemberCode(tx, branchId)

    const member = await tx.member.create({
      data: {
        branchId,
        userId: user.id,
        memberCode,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: emptyToNull(data.address),
        chapel: data.chapel,
        dateJoined: new Date(data.dateJoined),
        photoUrl: emptyToNull(data.photoUrl),
        soulTracker: reusableTrackerId
          ? { connect: { id: reusableTrackerId } }
          : { create: memberSoulTrackerCreate(branchId) },
      },
    })

    if (firstTimer) {
      await tx.firstTimer.update({
        where: { id: firstTimer.id },
        data: { status: "TREASURE_HUNT" },
      })
    }

    return { member, user }
  })

  try {
    await sendMemberWelcome({
      to: email,
      firstName: created.user.firstName,
      temporaryPassword,
    })
  } catch (error) {
    if (reusableTrackerId) {
      await prisma.soulTracker.update({
        where: { id: reusableTrackerId },
        data: { memberId: null },
      })
    }
    await prisma.member.delete({ where: { id: created.member.id } })
    await prisma.user.delete({ where: { id: created.user.id } })
    console.error(error)
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? error.message
        : "Member could not be invited because the welcome email failed."
    throw new MemberInviteError(message, 502)
  }

  return created.member
}

async function findMatchingFirstTimer(
  branchId: string,
  input: {
    email: string
    phone: string
    firstName: string
    lastName: string
  }
) {
  const byEmail = await prisma.firstTimer.findFirst({
    where: {
      branchId,
      email: { equals: input.email, mode: "insensitive" },
      soulTracker: { is: { memberId: null } },
    },
    include: { soulTracker: { select: { id: true, memberId: true } } },
    orderBy: { registeredAt: "desc" },
  })
  if (byEmail) {
    return byEmail
  }

  return prisma.firstTimer.findFirst({
    where: {
      branchId,
      phone: input.phone,
      firstName: { equals: input.firstName, mode: "insensitive" },
      lastName: { equals: input.lastName, mode: "insensitive" },
      soulTracker: { is: { memberId: null } },
    },
    include: { soulTracker: { select: { id: true, memberId: true } } },
    orderBy: { registeredAt: "desc" },
  })
}
