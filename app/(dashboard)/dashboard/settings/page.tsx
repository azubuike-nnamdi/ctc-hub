import { SettingsView } from "@/components/settings/settings-view"
import { requirePageAccess } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const { user } = await requirePageAccess("settings:profile")
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      lastLoginAt: true,
      passwordResetAt: true,
      passwordChangedAt: true,
      createdAt: true,
    },
  })

  return (
    <SettingsView
      role={user.role}
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      activity={{
        lastLoginAt: account?.lastLoginAt?.toISOString() ?? null,
        passwordResetAt: account?.passwordResetAt?.toISOString() ?? null,
        passwordChangedAt: account?.passwordChangedAt?.toISOString() ?? null,
        createdAt: (account?.createdAt ?? new Date()).toISOString(),
      }}
    />
  )
}
