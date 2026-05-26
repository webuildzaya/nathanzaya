import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import DashboardNav from '@/components/ui/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, fullName: true, isOnboarded: true },
  })

  if (!user) redirect('/login')

  // Redirect users who haven't completed onboarding
  if (!user.isOnboarded) redirect('/onboarding')
  

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav role={user.role} fullName={user.fullName} />
      <main className="pt-14 pb-20 md:pt-0 md:pb-0 md:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  )
}
