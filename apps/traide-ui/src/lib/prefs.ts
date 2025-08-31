"use client"
import { useEffect, useState } from 'react'

export function usePref<T = string>(key: string, initial: T) {
  const k = `traide.pref.${key}`
  const [val, setVal] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try { const s = localStorage.getItem(k); return (s ? JSON.parse(s) : initial) as T } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(k, JSON.stringify(val)) } catch {} }, [k, val])
  return [val, setVal] as const
}

