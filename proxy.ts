import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const isLoggedIn = Boolean(req.auth)
  const mustChangePassword = Boolean(req.auth?.user?.mustChangePassword)
  const path = req.nextUrl.pathname
  const isLogin = path.startsWith("/login")
  const isResetPassword = path.startsWith("/reset-password")
  const isAuthApi = path.startsWith("/api/auth")
  const isPasswordApi = path.startsWith("/api/users/password")

  if (isAuthApi) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    if (isLogin) {
      return NextResponse.next()
    }
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (mustChangePassword) {
    if (isResetPassword || isPasswordApi) {
      return NextResponse.next()
    }
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/reset-password", req.nextUrl))
  }

  if (isLogin || isResetPassword) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
