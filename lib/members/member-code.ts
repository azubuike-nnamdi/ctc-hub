import type { DbClient } from "@/lib/db/prisma"

function memberCodePrefix(slug: string) {
  return slug.slice(0, 3).toUpperCase()
}

export async function allocateMemberCode(
  tx: DbClient,
  branchId: string
) {
  const branch = await tx.branch.update({
    where: { id: branchId },
    data: { memberSeq: { increment: 1 } },
  })
  return `${memberCodePrefix(branch.slug)}-${String(branch.memberSeq).padStart(4, "0")}`
}
