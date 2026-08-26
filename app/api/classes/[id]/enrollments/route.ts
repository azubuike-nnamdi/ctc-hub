import { handleRouteError, jsonError, jsonOk } from "@/lib/api/errors"
import { requireBranchContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { classDb, classDetailInclude, enrollSoulInClass } from "@/lib/classes/enroll"
import { serializeClassDetail } from "@/lib/classes/serialize"
import { discipleshipEnrollmentSchema } from "@/lib/validation/schemas"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const { branchId } = await requireBranchContext("soul-tracker:write")
    const { id } = await params
    const { soulTrackerId } = discipleshipEnrollmentSchema.parse(
      await request.json()
    )

    await prisma.$transaction((tx) =>
      enrollSoulInClass(tx, { classId: id, branchId, soulTrackerId })
    )

    const record = await classDb(prisma).discipleshipClass.findFirst({
      where: { id, branchId },
      include: classDetailInclude(),
    })
    if (!record) {
      return jsonError("Class not found.", 404)
    }
    return jsonOk(serializeClassDetail(record), 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
