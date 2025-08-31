"use client"
import { useMcpConfig } from '@/lib/config'
import { useState } from 'react'
import { GlassButton } from './GlassCard'

export function EndpointControl() {
  const { baseUrl, setBaseUrl } = useMcpConfig()
  const [val, setVal] = useState(baseUrl)
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      {!open ? (
        <button aria-label="Edit MCP endpoint" className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15" onClick={() => setOpen(true)}>
          Endpoint: {truncate(baseUrl, 32)}
        </button>
      ) : (
        <div className="absolute right-0 z-20 w-[380px] rounded-2xl border border-white/10 bg-base-900/95 p-3 shadow-depth backdrop-blur-md">
          <div className="text-xs text-white/80">MCP Base URL</div>
          <input
            className="mt-2 w-full rounded-lg border border-white/20 bg-base-800/80 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
            placeholder="http://172.72.72.2:65000"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <GlassButton className="bg-white/5" onClick={() => { setOpen(false); setVal(baseUrl) }}>Cancel</GlassButton>
            <GlassButton className="bg-white/10" onClick={() => { setBaseUrl(val.trim()); setOpen(false) }}>Save</GlassButton>
          </div>
        </div>
      )}
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 3) + '...' : s
}
