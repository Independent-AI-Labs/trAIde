import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { sseUrl } from '@/lib/mcp'

const OLD_ENV = process.env

describe('mcp helpers', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV }
    // Reset cookie
    Object.defineProperty(document, 'cookie', { writable: true, value: '' })
  })
  afterEach(() => {
    process.env = OLD_ENV
    Object.defineProperty(document, 'cookie', { writable: true, value: '' })
  })

  it('uses NEXT_PUBLIC_MCP_BASE_URL when set', () => {
    process.env.NEXT_PUBLIC_MCP_BASE_URL = 'http://example:1234'
    expect(sseUrl('/stream/klines?x=1')).toBe('http://example:1234/stream/klines?x=1')
  })

  it('falls back to mcp cookie when env not set', () => {
    delete process.env.NEXT_PUBLIC_MCP_BASE_URL
    document.cookie = 'mcp=' + encodeURIComponent('http://foo:62007')
    expect(sseUrl('/stream/klines')).toBe('http://foo:62007/stream/klines')
  })

  it('falls back to localhost when no base configured', () => {
    delete process.env.NEXT_PUBLIC_MCP_BASE_URL
    document.cookie = ''
    expect(sseUrl('/stream/klines')).toBe('http://localhost:62007/stream/klines')
  })
})
