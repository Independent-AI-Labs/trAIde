export function getEnv() {
  const baseUrl = process.env.NEXT_PUBLIC_MCP_BASE_URL || 'http://localhost:8787'
  const streamTransport = (process.env.NEXT_PUBLIC_STREAM_TRANSPORT || 'sse') as 'sse' | 'ws'
  return { baseUrl, streamTransport }
}

