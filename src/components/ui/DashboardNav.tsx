'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

type Role = 'SUPER_ADMIN' | 'STAFF' | 'INSTRUCTOR'

interface NavItem {
  label: string
  href: string
  roles: Role[]
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', roles: ['SUPER_ADMIN'], icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { label: 'Students', href: '/students', roles: ['SUPER_ADMIN', 'STAFF'], icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Lessons', href: '/lessons', roles: ['SUPER_ADMIN', 'STAFF'], icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Payments', href: '/payments', roles: ['SUPER_ADMIN', 'STAFF'], icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Instructors', href: '/instructors', roles: ['SUPER_ADMIN'], icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Vehicles', href: '/vehicles', roles: ['SUPER_ADMIN'], icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Reports', href: '/reports', roles: ['SUPER_ADMIN'], icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'My Schedule', href: '/schedule', roles: ['INSTRUCTOR'], icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
]

interface Props {
  role: Role
  fullName: string
}

export default function DashboardNav({ role, fullName }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="h-20 flex items-center px-6 mb-4">
          <img src="/logo.svg" alt="Zaya Drives" className="h-10 w-auto" />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out (fixed at bottom) */}
        <div className="p-4 border-t border-gray-100">
          <button
            id="sign-out-desktop"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
          <div className="mt-4 px-4 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
             </div>
             <p className="text-xs font-bold text-gray-900 truncate">{fullName}</p>
          </div>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 inset-x-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <img src="/logo.svg" alt="Zaya Drives" className="h-8 w-auto" />
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-10 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed top-14 inset-x-0 z-20 bg-white border-b border-gray-200 transition-transform ${
          mobileOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <nav className="px-3 py-3 space-y-1">
          {visibleItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            id="sign-out-mobile"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full h-10 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Mobile bottom nav (always visible on mobile) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 flex">
        {visibleItems.slice(0, 5).map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold uppercase tracking-tighter transition-colors min-h-[64px] ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
