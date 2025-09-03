import './globals.css'
import type { ReactNode } from 'react'
import { MCPConfigProvider } from '@/lib/config'
import { NetConfigProvider } from '@/lib/net/config'
import { MarketCacheProvider } from '@/lib/data/market-cache'
import { ToastProvider } from '@/components/ui/Toast'
import { FloatingHeader } from '@/components/ui/FloatingHeader'
import { UIOverlayProvider } from '@/lib/ui/modals'
import { GlobalModalsHost } from '@/components/ui/GlobalModalsHost'

export const metadata = {
  title: 'Traide — Technical Analysis Platform',
  description: 'Real-time TA with glass design',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <MCPConfigProvider>
          <NetConfigProvider concurrency={12} ttlMs={10_000}>
          <MarketCacheProvider>
            <ToastProvider>
              <UIOverlayProvider>
                <main className="relative min-h-screen">
                  <div className="pointer-events-none absolute inset-0 holo-ring opacity-20 blur-3xl" />
                  <FloatingHeader />
                  {children}
                </main>
                <GlobalModalsHost />
              </UIOverlayProvider>
            </ToastProvider>
          </MarketCacheProvider>
          </NetConfigProvider>
        </MCPConfigProvider>
      </body>
    </html>
  )
}
