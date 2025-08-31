import { ReactNode, useMemo, useState } from 'react'

export type Column<T> = {
  key: keyof T
  label: string
  align?: 'left' | 'right'
  render?: (row: T) => ReactNode
}

export function DataTable<T extends { [k: string]: any }>({ rows, columns, defaultSort, className }: { rows: T[]; columns: Column<T>[]; defaultSort?: { key: keyof T; desc?: boolean }; className?: string }) {
  const [sortKey, setSortKey] = useState<keyof T>(defaultSort?.key || columns[0]!.key)
  const [desc, setDesc] = useState<boolean>(defaultSort?.desc ?? true)
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      return (desc ? -1 : 1) * (va === vb ? 0 : va > vb ? 1 : -1)
    })
  }, [rows, sortKey, desc])
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm" role="table">
          <thead className="bg-white/5 text-white/70" role="rowgroup">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className={`px-3 py-2 font-medium ${c.align === 'right' ? 'text-right' : 'text-left'}`} aria-sort={sortKey === c.key ? (desc ? 'descending' : 'ascending') : 'none'}>
                  <button className="inline-flex items-center gap-1" onClick={() => { if (sortKey === c.key) setDesc(!desc); else { setSortKey(c.key); setDesc(true) } }} aria-label={`Sort by ${c.label}`}>
                    <span>{c.label}</span>
                    {sortKey === c.key ? <span className="text-xs">{desc ? '↓' : '↑'}</span> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {sorted.map((r, idx) => (
              <tr key={idx} className="border-t border-white/10 hover:bg-white/5">
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {c.render ? c.render(r) : String(r[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
