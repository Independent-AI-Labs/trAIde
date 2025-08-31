"use client"
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (dsn) {
      // Stub: In a real setup, integrate @sentry/nextjs. For now, JSON log.
      console.error('[sentry-stub]', { message: error.message, stack: error.stack, digest: error.digest })
    } else {
      console.error(error)
    }
  }, [error])
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-white/70">An unexpected error occurred. Try again or return home.</p>
            <div className="mt-4 flex gap-3">
              <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => reset()}>Try again</button>
              <a className="rounded-lg bg-white/5 px-3 py-2 text-sm" href="/">Home</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

