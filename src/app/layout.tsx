import type { Metadata } from 'next'
import { Hanken_Grotesk, Vollkorn } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { MainNavbar } from '@/components/shared/main-navbar'
import { MobileNav } from '@/components/shared/mobile-nav'
import { AnalyticsTracker } from '@/components/shared/analytics-tracker'

const bodyFont = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body-loaded', display: 'swap' })
const headingFont = Vollkorn({ subsets: ['latin'], weight: '600', variable: '--font-heading-loaded', display: 'swap' })

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
    <html lang="id" className={`${bodyFont.variable} ${headingFont.variable}`} suppressHydrationWarning>
      <body>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:text-foreground">
                Lewati ke konten
              </a>
        <AuthProvider>
          <AnalyticsTracker />
          <MainNavbar />
          <div id="main-content" tabIndex={-1} className="app-content">
            {children}
          </div>
          <MobileNav />
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
