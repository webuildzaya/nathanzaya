import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: string
      schoolId: string
      isOnboarded: boolean
    }
  }

  interface User {
    role?: string
    schoolId?: string
    isOnboarded?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    schoolId?: string
    isOnboarded?: boolean
  }
}

export {}