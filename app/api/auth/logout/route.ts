import { NextResponse } from "next/server"

import { clearAuthCookies, revokeCurrentRefreshToken } from "@/lib/auth/tokens"

export const runtime = "nodejs"

export async function GET(request: Request) {
  await revokeCurrentRefreshToken()
  await clearAuthCookies()
  return NextResponse.redirect(new URL("/login", request.url))
}
