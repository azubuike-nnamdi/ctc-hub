import { compare } from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import {
  ACCESS_MAX_AGE,
  LOGIN_IP_MAX_ATTEMPTS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
} from "@/lib/auth/constants"
import {
  clearRateLimit,
  clientIp,
  consumeRateLimit,
  RateLimitError,
} from "@/lib/auth/rate-limit"
import {
  clearRefreshCookie,
  issueRefreshToken,
  revokeCurrentRefreshToken,
} from "@/lib/auth/tokens"
import { prisma } from "@/lib/db/prisma"
import { loginSchema } from "@/lib/validation/schemas"

export const { handlers, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: ACCESS_MAX_AGE },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const email = parsed.data.email.toLowerCase()

        try {
          await consumeRateLimit(
            `login:${email}`,
            LOGIN_MAX_ATTEMPTS,
            LOGIN_WINDOW_MS
          )
          if (request) {
            await consumeRateLimit(
              `login-ip:${clientIp(request)}`,
              LOGIN_IP_MAX_ATTEMPTS,
              LOGIN_WINDOW_MS
            )
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            return null
          }
          throw error
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            member: { select: { isDeleted: true } },
          },
        })

        if (!user) {
          return null
        }

        const valid = await compare(parsed.data.password, user.passwordHash)
        if (!valid) {
          return null
        }

        if (user.member?.isDeleted || !user.isActive) {
          return null
        }

        await clearRateLimit(`login:${email}`)

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
  events: {
    async signIn({ user }) {
      if (user.id) {
        await issueRefreshToken(user.id)
      }
    },
    async signOut() {
      await revokeCurrentRefreshToken()
      await clearRefreshCookie()
    },
  },
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
