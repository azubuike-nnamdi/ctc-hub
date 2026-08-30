import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"

import {
  generateFirstTimerQrPng,
  loadDefaultWatermark,
} from "../lib/first-timers/qr"
import { getAppUrl } from "../lib/utils/app-url"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@treasurecity.org"
  const password = process.env.SEED_ADMIN_PASSWORD ?? ""
  if (password.length < 8) {
    throw new Error("Set SEED_ADMIN_PASSWORD to at least 8 characters.")
  }

  const organization = await prisma.organization.upsert({
    where: { id: "org_ctc" },
    update: { name: "Christ Treasure Centre" },
    create: {
      id: "org_ctc",
      name: "Christ Treasure Centre",
    },
  })

  const yaba = await prisma.branch.upsert({
    where: { slug: "yaba" },
    update: { name: "Yaba" },
    create: {
      organizationId: organization.id,
      name: "Yaba",
      slug: "yaba",
    },
  })

  const passwordHash = await hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      firstName: "James",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      branchId: yaba.id,
      isActive: true,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
    create: {
      email,
      passwordHash,
      firstName: "James",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      branchId: yaba.id,
      isActive: true,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  })

  const targetUrl = `${getAppUrl()}/register/${yaba.slug}`
  const { imagePng, watermarkPng } = await generateFirstTimerQrPng({
    targetUrl,
    watermarkPng: await loadDefaultWatermark(),
  })

  await prisma.branchQrCode.upsert({
    where: { branchId: yaba.id },
    create: {
      branchId: yaba.id,
      targetUrl,
      imagePng,
      watermarkPng,
      createdById: admin.id,
    },
    update: {
      targetUrl,
      imagePng,
      watermarkPng,
      createdById: admin.id,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
