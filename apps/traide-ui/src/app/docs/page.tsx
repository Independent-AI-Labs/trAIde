"use client"
import Link from 'next/link'

export default function DocsHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-white/80">
      <h1 className="mb-4 text-2xl font-semibold text-white/90">Docs</h1>
      <p className="mb-6">Developer and user documentation hub. See README and in-app help.</p>
      <Link href="/app" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/15">Open App</Link>
    </div>
  )
}

