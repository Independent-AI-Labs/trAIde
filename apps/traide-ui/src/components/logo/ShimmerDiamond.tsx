"use client"

import React, { useEffect, useRef } from "react"

type Props = {
  size?: number
  className?: string
}

export default function ShimmerDiamond({ size = 26, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    const cssW = size
    const cssH = size
    canvas.width = Math.floor(cssW * dpr)
    canvas.height = Math.floor(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let raf = 0
    const cx = cssW / 2
    const cy = cssH / 2
    const pad = Math.max(3, Math.floor(cssW * 0.18))
    const top = { x: cx, y: pad }
    const right = { x: cssW - pad, y: cy }
    const bottom = { x: cx, y: cssH - pad }
    const left = { x: pad, y: cy }
    const center = { x: cx, y: cy }

    function line(a: { x: number; y: number }, b: { x: number; y: number }) {
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }

    const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

    const draw = (ts: number) => {
      const t = (ts || 0) * 0.0002 // shimmer speed
      ctx.clearRect(0, 0, cssW, cssH)

      // Base faint lines
      ctx.globalCompositeOperation = "source-over"
      ctx.lineWidth = 0.9
      ctx.strokeStyle = "rgba(255,255,255,0.07)"

      // Outline
      line(top, right)
      line(right, bottom)
      line(bottom, left)
      line(left, top)

      // Facets
      line(center, top)
      line(center, right)
      line(center, bottom)
      line(center, left)
      line(top, bottom)
      line(left, right)

      const mTR = midpoint(top, right)
      const mRB = midpoint(right, bottom)
      const mBL = midpoint(bottom, left)
      const mLT = midpoint(left, top)
      line(center, mTR)
      line(center, mRB)
      line(center, mBL)
      line(center, mLT)

      // Shimmer overlay
      const phase = t % 1
      const g = ctx.createLinearGradient(0, 0, cssW, cssH)
      function wrap(n: number) {
        return ((n % 1) + 1) % 1
      }
      const stops: Array<[number, string]> = [
        [wrap(phase - 0.18), "rgba(255,255,255,0.05)"],
        [wrap(phase - 0.02), "rgba(255,255,255,0.9)"],
        [wrap(phase + 0.03), "rgba(125,211,252,0.5)"],
        [wrap(phase + 0.12), "rgba(255,255,255,0.05)"],
        [wrap(phase + 0.5 - 0.18), "rgba(255,255,255,0.05)"],
        [wrap(phase + 0.5 - 0.02), "rgba(255,255,255,0.9)"],
        [wrap(phase + 0.5 + 0.03), "rgba(125,211,252,0.5)"],
        [wrap(phase + 0.5 + 0.12), "rgba(255,255,255,0.05)"],
      ]
      stops.sort((a, b) => a[0] - b[0]).forEach(([o, c]) => g.addColorStop(o, c))

      ctx.globalCompositeOperation = "lighter"
      ctx.strokeStyle = g
      ctx.lineWidth = 0.85

      // Re-stroke selective lines for shimmer
      line(top, right)
      line(right, bottom)
      line(bottom, left)
      line(left, top)
      line(center, top)
      line(center, right)
      line(center, bottom)
      line(center, left)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden="true"
      width={size}
      height={size}
    />
  )
}

