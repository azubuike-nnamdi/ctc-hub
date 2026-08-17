import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"

function isPublicPage(path: string) {
  return (
    path === "/login" || path === "/register" || path.startsWith("/register/")
  )
}

function isPublicApi(path: string, method: string) {
  if (path.startsWith("/api/auth")) {
    return true
  }
  return method === "POST" && path === "/api/public/first-timers"
}

export const proxy = auth((req) => {
  const isLoggedIn = Boolean(req.auth)
  const mustChangePassword = Boolean(req.auth?.user?.mustChangePassword)
  const path = req.nextUrl.pathname
  const isResetPassword = path.startsWith("/reset-password")
  const isPasswordApi = path.startsWith("/api/users/password")

  if (isPublicApi(path, req.method)) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    if (isPublicPage(path)) {
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

  if (path.startsWith("/login") || isResetPassword) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
