import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/ui/DashboardNav'

type Role = 'SUPER_ADMIN' | 'STAFF' | 'INSTRUCTOR'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) redirect('/login')
  if (!session?.user?.isOnboarded) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        role={(session?.user?.role ?? 'STAFF') as Role}
        fullName={session?.user?.name ?? ''}
      />
      <main className="pt-14 pb-20 md:pt-0 md:pb-0 md:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  )
}