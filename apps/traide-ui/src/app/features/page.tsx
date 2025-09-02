"use client"
import Link from 'next/link'

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-white/80">
      <h1 className="mb-4 text-2xl font-semibold text-white/90">Features</h1>
      <p className="mb-6">Streaming charts, indicators, scanner, and secure proxy.</p>
      <ul className="mb-8 list-disc space-y-2 pl-6">
        <li>Real-time SSE streaming with backoff</li>
        <li>Overlay indicators and presets</li>
        <li>Layouts and panel canvas</li>
        <li>Hardened MCP proxy</li>
      </ul>
      <Link href="/app" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/15">Open App</Link>
    </div>
  )
}

