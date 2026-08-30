import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"

export class RateLimitError extends Error {
  constructor() {
    super("Too many attempts. Try again later.")
    this.name = "RateLimitError"
  }
}

export function clientIp(request: Request) {
  const trustProxy =
    process.env.TRUST_PROXY === "true" || process.env.NODE_ENV !== "production"
  if (!trustProxy) {
    return "unknown"
  }

  const forwarded = request.headers.get("x-forwarded-for")
  const first = forwarded?.split(",")[0]?.trim()
  if (first) {
    return first
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

export async function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number
) {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)
  const [result] = await prisma.$queryRaw<Array<{ count: number }>>(
    Prisma.sql`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimit"."resetAt" <= ${now} THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt}
          ELSE "RateLimit"."resetAt"
        END
      RETURNING "count"
    `
  )

  if (!result || result.count > max) {
    throw new RateLimitError()
  }
}

export async function clearRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } })
}
