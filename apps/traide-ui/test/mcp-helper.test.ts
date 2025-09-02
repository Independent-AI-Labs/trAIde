import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { sseUrl, getMcpBaseUrlClient } from '@/lib/mcp'

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

  it('sseUrl always proxies through /api/mcp', () => {
    process.env.NEXT_PUBLIC_MCP_BASE_URL = 'http://example:1234'
    expect(sseUrl('/stream/klines?x=1')).toBe('/api/mcp/stream/klines?x=1')
    delete process.env.NEXT_PUBLIC_MCP_BASE_URL
    document.cookie = 'mcp=' + encodeURIComponent('http://foo:62007')
    expect(sseUrl('/stream/klines')).toBe('/api/mcp/stream/klines')
    document.cookie = ''
    expect(sseUrl('/stream/klines')).toBe('/api/mcp/stream/klines')
  })

  it('getMcpBaseUrlClient reads env, then cookie', () => {
    process.env.NEXT_PUBLIC_MCP_BASE_URL = 'http://example:1234'
    expect(getMcpBaseUrlClient()).toBe('http://example:1234')
    delete process.env.NEXT_PUBLIC_MCP_BASE_URL
    document.cookie = 'mcp=' + encodeURIComponent('http://foo:62007')
    expect(getMcpBaseUrlClient()).toBe('http://foo:62007')
  })

  it('getMcpBaseUrlClient falls back to host:62007 when none configured', () => {
    delete process.env.NEXT_PUBLIC_MCP_BASE_URL
    document.cookie = ''
    const base = getMcpBaseUrlClient()
    expect(base && base.endsWith(':62007')).toBe(true)
  })
})
