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
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!valid) return null
        return { id: user.id, email: user.email, name: user.fullName }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, schoolId: true },
        })
        token.role = dbUser?.role
        token.schoolId = dbUser?.schoolId
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.schoolId = token.schoolId as string
      }
      return session
    },
  },
  pages: { signIn: '/login' },
})
