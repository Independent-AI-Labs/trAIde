"use client"
import ShimmerDiamond from '@/components/logo/ShimmerDiamond'
import { EndpointControl } from '@/components/ui/EndpointControl'
import { LayoutsButton } from '@/components/ui/LayoutsButton'
import { useModals } from '@/lib/ui/modals'

export function FloatingHeader() {
  const { openTicker } = useModals()
  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-40 ui-overlay"
      data-ui-overlay="1"
    >
      <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShimmerDiamond size={20} className="shrink-0" />
          <div className="text-sm font-semibold text-white/90">trAIde — Live Technical Analysis</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-white/10 p-1.5 text-white/90 hover:bg-white/15"
            aria-label="Open ticker selector"
            title="Select Ticker / Pair"
            onClick={() => openTicker()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="opacity-90"
            >
              <path d="M11 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" />
              <path d="M21 21l-3.8-3.8" />
              <path d="M7 12h8M11 8v8" />
            </svg>
          </button>
          <LayoutsButton />
          <EndpointControl />
        </div>
      </div>
    </div>
  )
}
