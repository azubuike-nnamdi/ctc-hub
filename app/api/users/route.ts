import { hash } from "bcryptjs"
import {
  emptyToNull,
  handleRouteError,
  jsonError,
  jsonOk,
} from "@/lib/api/errors"
import { generateTemporaryPassword } from "@/lib/auth/password"
import { requireBranchContext, requireApiUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { sendStaffOnboardingEmail } from "@/lib/mail/onboarding-email"
import { getAppUrl } from "@/lib/utils/app-url"
import {
  paginationSchema,
  profileUpdateSchema,
  userCreateSchema,
} from "@/lib/validation/schemas"

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PASTOR: "Pastor",
  USHER: "Usher",
  FOLLOW_UP: "Follow-up",
}

export async function GET(request: Request) {
  try {
    const { user, branchId } = await requireBranchContext("users:read")
    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    })

    const where = {
      role: { not: "MEMBER" as const },
      ...(user.role === "SUPER_ADMIN" ? {} : { branchId }),
      ...(parsed.q
        ? {
            OR: [
              {
                firstName: {
                  contains: parsed.q,
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: parsed.q,
                  mode: "insensitive" as const,
                },
              },
              {
                email: { contains: parsed.q, mode: "insensitive" as const },
              },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          branchId: true,
          isActive: true,
          mustChangePassword: true,
          lastLoginAt: true,
          passwordResetAt: true,
          passwordChangedAt: true,
          createdAt: true,
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return jsonOk({
      items,
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user, branchId } = await requireBranchContext("users:write")
    if (user.role !== "SUPER_ADMIN") {
      return jsonError("Only a super admin can onboard staff.", 403)
    }

    const data = userCreateSchema.parse(await request.json())
    const assignedBranchId =
      data.role === "SUPER_ADMIN"
        ? emptyToNull(data.branchId ?? undefined)
        : data.branchId || branchId

    const temporaryPassword = generateTemporaryPassword()
    const created = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: await hash(temporaryPassword, 12),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        branchId: assignedBranchId,
        mustChangePassword: true,
        passwordResetAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        branchId: true,
      },
    })

    try {
      const appUrl = getAppUrl()
      await sendStaffOnboardingEmail({
        to: created.email,
        firstName: created.firstName,
        roleLabel: ROLE_LABELS[created.role] ?? created.role,
        temporaryPassword,
        loginUrl: `${appUrl}/login`,
      })
    } catch (error) {
      await prisma.user.delete({ where: { id: created.id } })
      console.error(error)
      const message =
        error instanceof Error && error.message.includes("not configured")
          ? error.message
          : "Staff could not be onboarded because the invitation email failed."
      return jsonError(message, 502)
    }

    return jsonOk(created, 201)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError("A user with that email already exists.", 409)
    }
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser()
    if (user.role === "MEMBER") {
      return jsonError("You do not have permission to do that.", 403)
    }
    const data = profileUpdateSchema.parse(await request.json())
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
    return jsonOk(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
