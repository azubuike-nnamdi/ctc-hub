import { hash } from "bcryptjs"

import { emptyToNull, MemberInviteError } from "@/lib/api/errors"
import { generateTemporaryPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db/prisma"
import { sendMemberWelcomeEmail } from "@/lib/mail/onboarding-email"
import { getAppUrl } from "@/lib/utils/app-url"
import type { memberSchema } from "@/lib/validation/schemas"
import type { z } from "zod"

type MemberValues = z.infer<typeof memberSchema>

function memberCodePrefix(slug: string) {
  return slug.slice(0, 3).toUpperCase()
}

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

    const branch = await tx.branch.update({
      where: { id: branchId },
      data: { memberSeq: { increment: 1 } },
    })
    const memberCode = `${memberCodePrefix(branch.slug)}-${String(branch.memberSeq).padStart(4, "0")}`

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
      },
    })

    return { member, user }
  })

  try {
    const appUrl = getAppUrl()
    await sendMemberWelcomeEmail({
      to: email,
      firstName: created.user.firstName,
      temporaryPassword,
      loginUrl: `${appUrl}/login`,
    })
  } catch (error) {
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
