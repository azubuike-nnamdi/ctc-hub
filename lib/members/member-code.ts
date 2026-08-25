import type { Prisma } from "@prisma/client"

function memberCodePrefix(slug: string) {
  return slug.slice(0, 3).toUpperCase()
}

export async function allocateMemberCode(
  tx: Prisma.TransactionClient,
  branchId: string
) {
  const branch = await tx.branch.update({
    where: { id: branchId },
    data: { memberSeq: { increment: 1 } },
  })
  return `${memberCodePrefix(branch.slug)}-${String(branch.memberSeq).padStart(4, "0")}`
}
