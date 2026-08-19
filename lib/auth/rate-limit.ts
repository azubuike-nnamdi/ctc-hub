import { prisma } from "@/lib/db/prisma"

export class RateLimitError extends Error {
  constructor() {
    super("Too many attempts. Try again later.")
    this.name = "RateLimitError"
  }
}

export function clientIp(request: Request) {
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
  const existing = await prisma.rateLimit.findUnique({ where: { key } })

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetAt: new Date(now.getTime() + windowMs),
      },
      update: {
        count: 1,
        resetAt: new Date(now.getTime() + windowMs),
      },
    })
    return
  }

  if (existing.count >= max) {
    throw new RateLimitError()
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })
}

export async function clearRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } })
}
