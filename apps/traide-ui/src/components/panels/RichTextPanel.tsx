"use client"
import React, { useEffect, useRef, useState } from 'react'

export function RichTextPanel({ storageKey }: { storageKey: string }) {
  const [html, setHtml] = useState<string>('')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!storageKey) return
    try {
      const s = localStorage.getItem(storageKey)
      if (s != null) setHtml(s)
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, html) } catch {}
  }, [html, storageKey])

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (ref.current) setHtml(ref.current.innerHTML)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={() => exec('bold')}>B</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15 italic" onClick={() => exec('italic')}>I</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={() => exec('insertUnorderedList')}>• List</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={() => exec('formatBlock','H2')}>H2</button>
      </div>
      <div
        ref={ref}
        className="min-h-[200px] flex-1 rounded-md border border-white/10 bg-base-900/40 p-3 text-sm outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
        dangerouslySetInnerHTML={{ __html: html || '<p class="text-white/60">Write notes here…</p>' }}
      />
    </div>
  )
}

