"use client"
import React, { createContext, useContext, useMemo } from 'react'
import { createLimiter } from './concurrency'

type Ctx = {
  schedule: <T>(fn: () => Promise<T>) => Promise<T>
  ttlMs: number
}

const C = createContext<Ctx | null>(null)

export function NetConfigProvider({ children, concurrency = 6, ttlMs = 10_000 }: { children: React.ReactNode; concurrency?: number; ttlMs?: number }) {
  const limiter = useMemo(() => createLimiter(concurrency), [concurrency])
  const api = useMemo<Ctx>(() => ({ schedule: limiter.schedule, ttlMs }), [limiter, ttlMs])
  return <C.Provider value={api}>{children}</C.Provider>
}

export function useNetConfig() {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useNetConfig must be used within NetConfigProvider')
  return ctx
}

