export { auth as middleware } from '@/lib/auth/config'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/students/:path*',
    '/lessons/:path*',
    '/payments/:path*',
    '/instructors/:path*',
    '/vehicles/:path*',
    '/reports/:path*',
    '/schedule/:path*',
  ],
}