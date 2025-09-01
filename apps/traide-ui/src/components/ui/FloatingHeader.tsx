"use client"
import ShimmerDiamond from '@/components/logo/ShimmerDiamond'
import { EndpointControl } from '@/components/ui/EndpointControl'

export function FloatingHeader() {
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-40 w-full max-w-7xl -translate-x-1/2 px-4 ui-overlay"
      data-ui-overlay="1"
    >
      <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShimmerDiamond size={20} className="shrink-0" />
          <div className="text-sm font-semibold text-white/90">trAIde — Live Technical Analysis</div>
        </div>
        <EndpointControl />
      </div>
    </div>
  )
}

