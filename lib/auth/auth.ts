import { compare } from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db/prisma"
import { loginSchema } from "@/lib/validation/schemas"

const attempts = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string) {
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }

  if (current.count >= 8) {
    return false
  }

  current.count += 1
  return true
}

export const { handlers, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const email = parsed.data.email.toLowerCase()
        if (!rateLimit(email)) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.isActive) {
          return null
        }

        const valid = await compare(parsed.data.password, user.passwordHash)
        if (!valid) {
          return null
        }

        attempts.delete(email)

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          firstName: user.firstName,
          lastName: user.lastName,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.branchId = user.branchId
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.mustChangePassword = user.mustChangePassword
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub ?? ""
      session.user.role = token.role
      session.user.branchId = token.branchId
      session.user.firstName = token.firstName
      session.user.lastName = token.lastName
      session.user.mustChangePassword = Boolean(token.mustChangePassword)
      session.user.name = `${token.firstName} ${token.lastName}`
      return session
    },
  },
})
