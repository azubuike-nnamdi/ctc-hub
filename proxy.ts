import { auth } from "@/lib/auth/auth"
import { homePathForRole, isMemberRole } from "@/lib/auth/rbac"
import { NextResponse } from "next/server"

function isPublicPage(path: string) {
  return (
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/register/") ||
    path === "/signup" ||
    path.startsWith("/signup/") ||
    path === "/support" ||
    path === "/privacy"
  )
}

function isPublicApi(path: string, method: string) {
  if (path.startsWith("/api/auth")) {
    return true
  }
  return (
    method === "POST" &&
    (path === "/api/public/first-timers" ||
      path === "/api/public/signup" ||
      path === "/api/public/support" ||
      path === "/api/public/consent")
  )
}

function isMemberApi(path: string) {
  return (
    path.startsWith("/api/auth") ||
    path.startsWith("/api/users/password") ||
    path.startsWith("/api/me")
  )
}

export const proxy = auth((req) => {
  const isLoggedIn = Boolean(req.auth)
  const role = req.auth?.user?.role
  const mustChangePassword = Boolean(req.auth?.user?.mustChangePassword)
  const path = req.nextUrl.pathname
  const isResetPassword = path.startsWith("/reset-password")
  const isPasswordApi = path.startsWith("/api/users/password")
  const home = role ? homePathForRole(role) : "/login"

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
        { success: false, message: "Password reset required" },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/reset-password", req.nextUrl))
  }

  if (
    path.startsWith("/login") ||
    isResetPassword ||
    path.startsWith("/signup")
  ) {
    return NextResponse.redirect(new URL(home, req.nextUrl))
  }

  if (role && isMemberRole(role)) {
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    if (path.startsWith("/api/") && !isMemberApi(path)) {
      return NextResponse.json(
        { success: false, message: "You do not have permission to do that." },
        { status: 403 }
      )
    }
    return NextResponse.next()
  }

  if (path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
