import { describe, it, expect } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { DataTable, Column } from '../src/components/ui/DataTable'

type Row = { a: string; n: number }

function render(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(node)
  return { container, root }
}

describe('DataTable', () => {
  it('sorts by header click', async () => {
    const rows: Row[] = [ { a: 'x', n: 2 }, { a: 'y', n: 1 } ]
    const cols: Column<Row>[] = [
      { key: 'a', label: 'A' },
      { key: 'n', label: 'N', align: 'right' },
    ]
    const { container } = render(<DataTable rows={rows} columns={cols} defaultSort={{ key: 'a', desc: false }} />)
    const headers = Array.from(container.querySelectorAll('th button')) as HTMLButtonElement[]
    // Click on N header to sort by number desc
    headers[1]!.click()
    // First row should now have n=2
    const firstRowCells = container.querySelectorAll('tbody tr:first-child td')
    expect(firstRowCells[1]!.textContent).toContain('2')
  })
})

