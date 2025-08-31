"use client"
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type Toast = { id: number; msg: string }
type Ctx = { push: (msg: string) => void }

const C = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setList((l) => [...l, { id, msg }])
    window.setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4000)
  }, [])
  const api = useMemo(() => ({ push }), [push])
  return (
    <C.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {list.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/90 backdrop-blur">
            {t.msg}
          </div>
        ))}
      </div>
    </C.Provider>
  )
}

export function useToast() {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

