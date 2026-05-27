import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { getClientIp, loginLimiter } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const ip = await getClientIp()
        const { success } = await loginLimiter.limit(ip)
        if (!success) throw new Error('Too many login attempts')

        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            fullName: true,
            passwordHash: true,
            role: true,
            schoolId: true,
            isOnboarded: true,
          },
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          schoolId: user.schoolId,
          isOnboarded: user.isOnboarded,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.schoolId = user.schoolId
        token.isOnboarded = user.isOnboarded
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
        session.user.isOnboarded = token.isOnboarded as boolean
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
})