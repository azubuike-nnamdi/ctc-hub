import { handleRouteError, jsonError } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const { branchId } = await requireBranchContext("first-timers:read")
    const record = await prisma.branchQrCode.findUnique({
      where: { branchId },
      select: { imagePng: true, updatedAt: true },
    })
    if (!record) {
      return jsonError("Generate a QR code first.", 404)
    }

    return new Response(Buffer.from(record.imagePng), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="ctc-first-timer-qr.png"',
        "Cache-Control": "private, no-store",
        "Last-Modified": record.updatedAt.toUTCString(),
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
