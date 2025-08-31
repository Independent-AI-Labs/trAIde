import './globals.css'
import type { ReactNode } from 'react'
import { MCPConfigProvider } from '@/lib/config'
import { MarketCacheProvider } from '@/lib/data/market-cache'
import { EndpointControl } from '@/components/ui/EndpointControl'

export const metadata = {
  title: 'Traide — Technical Analysis Platform',
  description: 'Real-time TA with glass design',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <MCPConfigProvider>
          <MarketCacheProvider>
            <main className="relative min-h-screen">
              <div className="pointer-events-none absolute inset-0 holo-ring opacity-20 blur-3xl" />
              <div className="fixed right-6 top-6 z-50"><EndpointControl /></div>
              {children}
            </main>
          </MarketCacheProvider>
        </MCPConfigProvider>
      </body>
    </html>
  )
}
