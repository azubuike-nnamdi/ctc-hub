import { PrismaClient } from "@prisma/client"

/**
 * Bump when the Prisma schema changes so the Next.js singleton does not keep
 * a client generated before the new fields/relations existed.
 */
const PRISMA_CLIENT_GENERATION = 5

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaGeneration?: number
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

if (globalForPrisma.prismaGeneration !== PRISMA_CLIENT_GENERATION) {
  void globalForPrisma.prisma?.$disconnect()
  globalForPrisma.prisma = createPrismaClient()
  globalForPrisma.prismaGeneration = PRISMA_CLIENT_GENERATION
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
