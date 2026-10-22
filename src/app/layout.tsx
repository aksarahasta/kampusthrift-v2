import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { MobileNav } from '@/components/shared/mobile-nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kampus Thrift',
  description: 'Hyperlocal C2C Preloved Marketplace',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <div className="pb-16 md:pb-0">
            {children}
          </div>
          <MobileNav />
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
