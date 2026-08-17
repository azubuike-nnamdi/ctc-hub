import type { Role } from "@/lib/auth/rbac"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role: Role
    branchId: string | null
    firstName: string
    lastName: string
    mustChangePassword: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      branchId: string | null
      firstName: string
      lastName: string
      mustChangePassword: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    branchId: string | null
    firstName: string
    lastName: string
    mustChangePassword: boolean
  }
}
