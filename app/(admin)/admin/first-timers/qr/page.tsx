import { FirstTimerQrProjector } from "@/components/first-timers/first-timer-qr-projector"
import { requirePageAccess } from "@/lib/auth/session"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "First timer QR code",
}

export default async function FirstTimerQrPage() {
  await requirePageAccess("first-timers:read")
  return <FirstTimerQrProjector />
}
