import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  generateFirstTimerQrPng,
  loadDefaultWatermark,
} from "@/lib/first-timers/qr"
import { getAppUrl } from "@/lib/utils/app-url"

function serializeQr(record: {
  targetUrl: string
  updatedAt: Date
  branch: { name: string; slug: string }
}) {
  return {
    targetUrl: record.targetUrl,
    branchName: record.branch.name,
    branchSlug: record.branch.slug,
    updatedAt: record.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const { branchId } = await requireBranchContext("first-timers:read")
    const record = await prisma.branchQrCode.findUnique({
      where: { branchId },
      select: {
        targetUrl: true,
        updatedAt: true,
        branch: { select: { name: true, slug: true } },
      },
    })
    if (!record) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { name: true, slug: true },
      })
      if (!branch) {
        return jsonError("Campus not found.", 404)
      }
      return jsonOk({
        targetUrl: `${getAppUrl()}/register/${branch.slug}`,
        branchName: branch.name,
        branchSlug: branch.slug,
        updatedAt: null,
      })
    }

    return jsonOk(serializeQr(record))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST() {
  try {
    const { user, branchId } = await requireBranchContext("first-timers:read")
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true, slug: true },
    })
    if (!branch) {
      return jsonError("Campus not found.", 404)
    }

    const existing = await prisma.branchQrCode.findUnique({
      where: { branchId },
      select: { watermarkPng: true },
    })

    const watermarkSource = existing?.watermarkPng
      ? Buffer.from(existing.watermarkPng)
      : await loadDefaultWatermark()

    const targetUrl = `${getAppUrl()}/register/${branch.slug}`
    const { imagePng, watermarkPng } = await generateFirstTimerQrPng({
      targetUrl,
      watermarkPng: watermarkSource,
    })

    const record = await prisma.branchQrCode.upsert({
      where: { branchId },
      create: {
        branchId,
        targetUrl,
        imagePng,
        watermarkPng,
        createdById: user.id,
      },
      update: {
        targetUrl,
        imagePng,
        watermarkPng,
        createdById: user.id,
      },
      select: {
        targetUrl: true,
        updatedAt: true,
        branch: { select: { name: true, slug: true } },
      },
    })

    return jsonOk(serializeQr(record), existing ? 200 : 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
