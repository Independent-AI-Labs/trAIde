"use client"
import React, { useEffect, useRef, useState } from 'react'

// Minimal HTML sanitizer without external deps. Whitelists basic tags,
// strips scripts, event handlers, and styles; normalizes anchors.
function sanitizeHTML(input: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input || '', 'text/html')
    const allowed = new Set(['P','B','I','STRONG','EM','UL','OL','LI','H1','H2','H3','BR','A'])
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null)
    const toRemove: Element[] = []
    while (walker.nextNode()) {
      const el = walker.currentNode as Element
      if (!allowed.has(el.tagName)) { toRemove.push(el); continue }
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase()
        if (name.startsWith('on') || name === 'style') el.removeAttribute(attr.name)
      }
      if (el.tagName === 'A') {
        const a = el as HTMLAnchorElement
        const href = a.getAttribute('href') || ''
        try {
          const u = new URL(href, window.location.origin)
          const prot = u.protocol.toLowerCase()
          if (prot !== 'http:' && prot !== 'https:') a.removeAttribute('href')
        } catch { a.removeAttribute('href') }
        a.setAttribute('rel', 'noopener noreferrer')
        if (a.getAttribute('target') === '_blank') a.setAttribute('rel', 'noopener noreferrer')
      }
    }
    for (const el of toRemove) el.replaceWith(...Array.from(el.childNodes))
    return doc.body.innerHTML
  } catch {
    return ''
  }
}

export function RichTextPanel({ storageKey }: { storageKey: string }) {
  const [html, setHtml] = useState<string>('')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!storageKey) return
    try {
      const s = localStorage.getItem(storageKey)
      if (s != null) setHtml(sanitizeHTML(s))
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, sanitizeHTML(html)) } catch {}
  }, [html, storageKey])

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (ref.current) {
      const cleaned = sanitizeHTML(ref.current.innerHTML)
      ref.current.innerHTML = cleaned
      setHtml(cleaned)
    }
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
        onInput={(e) => {
          const v = (e.target as HTMLDivElement).innerHTML
          const cleaned = sanitizeHTML(v)
          setHtml(cleaned)
        }}
        dangerouslySetInnerHTML={{ __html: html || '<p class="text-white/60">Write notes here…</p>' }}
      />
    </div>
  )
}
