import { prisma } from "@/lib/db/prisma"
import { redirect } from "next/navigation"

export default async function SignupIndexPage() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: { slug: true },
  })
  if (branches[0]) {
    redirect(`/signup/${branches[0].slug}`)
  }
  redirect("/login")
}
