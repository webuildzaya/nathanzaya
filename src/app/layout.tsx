import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/ui/Providers'

export const metadata: Metadata = {
  title: 'Zaya — Driving School Management',
  description:
    'Manage students, lessons, and payments for your driving school.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <Providers>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: { fontSize: '14px', maxWidth: '360px' },
              }}
            />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  )
}
