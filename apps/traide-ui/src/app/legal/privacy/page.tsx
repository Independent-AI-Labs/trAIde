"use client"
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-white/80">
      <h1 className="mb-4 text-2xl font-semibold text-white/90">Privacy Policy</h1>
      <p className="mb-6 text-white/70">Privacy details coming soon.</p>
      <Link href="/" className="text-white/80 underline">Home</Link>
    </div>
  )
}

