#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const ROOT = process.cwd()
const APP_DIR = path.join(ROOT, 'apps', 'traide-ui')
const MCP_DIR = path.join(ROOT, 'packages', 'traide-mcp')
const RUN_DIR = path.join(ROOT, '.run')
const PID_FILE = path.join(RUN_DIR, 'ui.pid')
const LOG_FILE = path.join(RUN_DIR, 'ui.log')
const MCP_PID = path.join(RUN_DIR, 'mcp.pid')
const MCP_LOG = path.join(RUN_DIR, 'mcp.log')

function ensureRunDir() {
  if (!fs.existsSync(RUN_DIR)) fs.mkdirSync(RUN_DIR, { recursive: true })
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function readPid() {
  try {
    const s = fs.readFileSync(PID_FILE, 'utf8').trim()
    const pid = Number(s)
    return Number.isFinite(pid) ? pid : null
  } catch {
    return null
  }
}

function writePid(pid) {
  ensureRunDir()
  fs.writeFileSync(PID_FILE, String(pid))
}

function removePid() {
  try { fs.unlinkSync(PID_FILE) } catch {}
}

function readMcpPid() {
  try {
    const s = fs.readFileSync(MCP_PID, 'utf8').trim()
    const pid = Number(s)
    return Number.isFinite(pid) ? pid : null
  } catch { return null }
}
function writeMcpPid(pid) {
  ensureRunDir(); fs.writeFileSync(MCP_PID, String(pid))
}
function removeMcpPid() { try { fs.unlinkSync(MCP_PID) } catch {} }

function parseArgs(argv) {
  const args = { _: [], flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, vRaw] = a.slice(2).split('=')
      let v = vRaw
      if (v == null) {
        const next = argv[i + 1]
        if (next && !next.startsWith('-')) { v = next; i++ }
        else v = true
      }
      args.flags[k] = v
    } else if (a.startsWith('-')) {
      const k = a.slice(1)
      args.flags[k] = true
    } else {
      args._.push(a)
    }
  }
  return args
}

function openBrowser(url) {
  const platform = process.platform
  let cmd, args
  if (platform === 'darwin') { cmd = 'open'; args = [url] }
  else if (platform === 'win32') { cmd = 'cmd'; args = ['/c', 'start', '""', url] }
  else { cmd = 'xdg-open'; args = [url] }
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).unref() } catch {}
}

async function startUI({ prod = false, port = 3333, baseUrl, envKVs = [], open = false, force = true, envFile } = {}) {
  if (!fs.existsSync(APP_DIR)) {
    console.error('Error: apps/traide-ui not found. Run from repo root.')
    process.exit(1)
  }
  ensureRunDir()
  const existing = readPid()
  if (existing && isAlive(existing)) {
    console.log(`UI already running with PID ${existing}`)
    process.exit(0)
  }

  const outFd = fs.openSync(LOG_FILE, 'a')
  const errFd = fs.openSync(LOG_FILE, 'a')

  const env = { ...process.env }
  if (envFile) Object.assign(env, loadEnvFile(envFile))
  if (baseUrl) env.NEXT_PUBLIC_MCP_BASE_URL = baseUrl
  for (const kv of envKVs) {
    const idx = kv.indexOf('=')
    if (idx > 0) env[kv.slice(0, idx)] = kv.slice(idx + 1)
  }

  // Preflight: ensure port is free
  if (force) {
    await killPorts([port])
  } else {
    const busy = await isPortBusy(port)
    if (busy) { console.error(`Port ${port} is busy. Use --force to free it.`); process.exit(1) }
  }

  const args = []
  let npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  if (prod) {
    // build first (synchronously, attached to logs)
    console.log('Building UI...')
    await new Promise((resolve, reject) => {
      const b = spawn(npmCmd, ['run', 'build'], { cwd: APP_DIR, env, stdio: ['ignore', outFd, errFd] })
      b.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build_failed'))))
    })
    console.log('Starting UI (prod)...')
    args.push('run', 'start', '--', '-p', String(port))
  } else {
    console.log('Starting UI (dev)...')
    args.push('run', 'dev', '--', '-p', String(port))
  }

  const child = spawn(npmCmd, args, {
    cwd: APP_DIR,
    env,
    detached: true,
    stdio: ['ignore', outFd, errFd],
  })
  writePid(child.pid)
  child.unref()
  console.log(`UI started (pid ${child.pid}) on http://localhost:${port}`)
  writeMeta('ui.port', String(port))
  if (open) openBrowser(`http://localhost:${port}`)
}

async function stopUI() {
  const pid = readPid()
  if (!pid) {
    console.log('No UI pid file found.')
    return
  }
  if (!isAlive(pid)) {
    console.log('UI not running; cleaning up pid file.')
    removePid()
    return
  }
  console.log(`Stopping UI (pid ${pid})...`)
  try { process.kill(pid, 'SIGTERM') } catch {}
  const start = Date.now()
  while (Date.now() - start < 8000) {
    if (!isAlive(pid)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  if (isAlive(pid)) {
    try { process.kill(pid, 'SIGKILL') } catch {}
  }
  removePid()
  console.log('UI stopped.')
}

function statusUI() {
  const pid = readPid()
  if (pid && isAlive(pid)) {
    console.log(`UI running (pid ${pid})`)
  } else {
    console.log('UI not running')
  }
}

function logsUI({ follow = false, lines = 200 } = {}) {
  ensureRunDir()
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No log file yet.')
    return
  }
  const content = fs.readFileSync(LOG_FILE, 'utf8').split('\n')
  const start = Math.max(0, content.length - lines)
  for (let i = start; i < content.length; i++) console.log(content[i])
  if (follow) {
    let pos = fs.statSync(LOG_FILE).size
    fs.watch(LOG_FILE, { persistent: true }, () => {
      try {
        const stat = fs.statSync(LOG_FILE)
        if (stat.size < pos) { pos = stat.size; return }
        const fd = fs.openSync(LOG_FILE, 'r')
        const buf = Buffer.alloc(stat.size - pos)
        fs.readSync(fd, buf, 0, buf.length, pos)
        fs.closeSync(fd)
        pos = stat.size
        process.stdout.write(buf.toString('utf8'))
      } catch {}
    })
  }
}

async function startMCP({ port = 8787, corsOrigin, mini = true, force = true, envFile } = {}) {
  if (!fs.existsSync(MCP_DIR)) {
    console.error('Error: packages/traide-mcp not found. Run from repo root.')
    process.exit(1)
  }
  ensureRunDir()
  const existing = readMcpPid()
  if (existing && isAlive(existing)) {
    console.log(`MCP already running with PID ${existing}`)
    process.exit(0)
  }
  const outFd = fs.openSync(MCP_LOG, 'a')
  const errFd = fs.openSync(MCP_LOG, 'a')

  const env = { ...process.env }
  if (envFile) Object.assign(env, loadEnvFile(envFile))
  env.PORT = String(port)
  if (corsOrigin) env.MCP_CORS_ORIGINS = corsOrigin

  let cmd, args
  if (mini) {
    cmd = process.platform === 'win32' ? 'node.exe' : 'node'
    args = ['dev-server.js']
  } else {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    cmd = npmCmd
    args = ['run', 'dev:http']
  }
  // Preflight: ensure port is free
  if (force) {
    await killPorts([port])
  } else {
    const busy = await isPortBusy(port)
    if (busy) { console.error(`Port ${port} is busy. Use --force to free it.`); process.exit(1) }
  }
  console.log(`Starting MCP (${mini ? 'mini' : 'dev:http'}) on :${port}...`)
  const child = spawn(cmd, args, { cwd: MCP_DIR, env, detached: true, stdio: ['ignore', outFd, errFd] })
  writeMcpPid(child.pid)
  child.unref()
  console.log(`MCP started (pid ${child.pid}) on http://localhost:${port}`)
  writeMeta('mcp.port', String(port))
}

async function stopMCP() {
  const pid = readMcpPid()
  if (!pid) { console.log('No MCP pid file found.'); return }
  if (!isAlive(pid)) { console.log('MCP not running; cleaning up pid file.'); removeMcpPid(); return }
  console.log(`Stopping MCP (pid ${pid})...`)
  try { process.kill(pid, 'SIGTERM') } catch {}
  const start = Date.now()
  while (Date.now() - start < 8000) {
    if (!isAlive(pid)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  if (isAlive(pid)) { try { process.kill(pid, 'SIGKILL') } catch {} }
  removeMcpPid(); console.log('MCP stopped.')
}

function statusMCP() {
  const pid = readMcpPid()
  if (pid && isAlive(pid)) console.log(`MCP running (pid ${pid})`) 
  else console.log('MCP not running')
}

function logsMCP({ follow = false, lines = 200 } = {}) {
  ensureRunDir()
  if (!fs.existsSync(MCP_LOG)) { console.log('No MCP log file yet.'); return }
  const content = fs.readFileSync(MCP_LOG, 'utf8').split('\n')
  const start = Math.max(0, content.length - lines)
  for (let i = start; i < content.length; i++) console.log(content[i])
  if (follow) {
    let pos = fs.statSync(MCP_LOG).size
    fs.watch(MCP_LOG, { persistent: true }, () => {
      try {
        const stat = fs.statSync(MCP_LOG)
        if (stat.size < pos) { pos = stat.size; return }
        const fd = fs.openSync(MCP_LOG, 'r')
        const buf = Buffer.alloc(stat.size - pos)
        fs.readSync(fd, buf, 0, buf.length, pos)
        fs.closeSync(fd)
        pos = stat.size
        process.stdout.write(buf.toString('utf8'))
      } catch {}
    })
  }
}

async function startAll({ uiPort = 65001, mcpPort = 65000, mini = true, open = false, cors, force = true, envFile } = {}) {
  const uiOrigin = `http://localhost:${uiPort}`
  const corsOrigin = cors || '*'
  await startMCP({ port: mcpPort, corsOrigin, mini, force, envFile })
  await startUI({ port: uiPort, baseUrl: `http://localhost:${mcpPort}`, open, force, envFile })
}

async function stopAll() {
  await stopUI()
  await stopMCP()
}

function statusAll() {
  statusMCP(); statusUI()
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const [domain, subcmd] = argv._
  const help = () => {
    console.log(`Usage:
  traide-runner ui <start|stop|status|logs> [--prod] [--port 3333] [--open] [--base-url URL] [--env KEY=VALUE] [--env-file .env] [--no-force]
  traide-runner mcp <start|stop|status|logs> [--port 8787] [--cors http://localhost:3333] [--mini] [--env-file .env] [--no-force]
  traide-runner all <start|stop|status|nuke> [--ui-port 3333] [--mcp-port 8787] [--mini] [--open] [--env-file .env] [--no-force]
`)
  }
  if (!domain) return help()
  if (domain === 'ui') {
    const port = argv.flags.port ? Number(argv.flags.port) : 3333
    const baseUrl = argv.flags['base-url'] || process.env.NEXT_PUBLIC_MCP_BASE_URL
    const envKVs = ([]).concat(argv.flags.env || []).flat().filter(Boolean)
    const open = Boolean(argv.flags.open)
    const force = argv.flags['no-force'] ? false : true
    const envFile = argv.flags['env-file']
    const prod = Boolean(argv.flags.prod)
    switch (subcmd) {
      case 'start': return await startUI({ prod, port, baseUrl, envKVs, open, force, envFile })
      case 'stop': return await stopUI()
      case 'status': return statusUI()
      case 'logs': return logsUI({ follow: Boolean(argv.flags.follow), lines: argv.flags.lines ? Number(argv.flags.lines) : 200 })
      default: return help()
    }
  } else if (domain === 'mcp') {
    const port = argv.flags.port ? Number(argv.flags.port) : 8787
    const cors = argv.flags.cors
    const force = argv.flags['no-force'] ? false : true
    const envFile = argv.flags['env-file']
    const mini = argv.flags.mini !== undefined ? Boolean(argv.flags.mini) : true
    switch (subcmd) {
      case 'start': return await startMCP({ port, corsOrigin: cors, mini, force, envFile })
      case 'stop': return await stopMCP()
      case 'status': return statusMCP()
      case 'logs': return logsMCP({ follow: Boolean(argv.flags.follow), lines: argv.flags.lines ? Number(argv.flags.lines) : 200 })
      default: return help()
    }
  } else if (domain === 'all') {
    const uiPort = argv.flags['ui-port'] ? Number(argv.flags['ui-port']) : 65001
    const mcpPort = argv.flags['mcp-port'] ? Number(argv.flags['mcp-port']) : 65000
    const mini = argv.flags.mini !== undefined ? Boolean(argv.flags.mini) : true
    const force = argv.flags['no-force'] ? false : true
    const envFile = argv.flags['env-file']
    const open = Boolean(argv.flags.open)
    const cors = argv.flags.cors
    switch (subcmd) {
      case 'start': return await startAll({ uiPort, mcpPort, mini, open, cors, force, envFile })
      case 'stop': return await stopAll()
      case 'status': return statusAll()
      case 'nuke': {
        await stopAll()
        await killPorts([3333, 3000, 4000, 8080, 8787, 65000, 65001])
        console.log('All known ports killed.')
        return
      }
      default: return help()
    }
  } else {
    return help()
  }
}

async function killPorts(ports = []) {
  const tryKill = async (pid) => {
    try { process.kill(pid, 'SIGTERM') } catch {}
    await new Promise((r) => setTimeout(r, 200))
    try { process.kill(pid, 'SIGKILL') } catch {}
  }
  const run = (cmd, args) => new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] })
    let out = ''
    p.stdout.on('data', (b) => { out += b.toString('utf8') })
    p.on('exit', () => resolve(out))
  })
  for (const port of ports) {
    let pids = new Set()
    // Try lsof
    try {
      const out = await run(process.platform === 'win32' ? 'powershell.exe' : 'bash', [process.platform === 'win32' ? '-NoProfile' : '-lc', process.platform === 'win32' ? `Get-NetTCPConnection -LocalPort ${port} | Select-Object -ExpandProperty OwningProcess` : `command -v lsof >/dev/null 2>&1 && lsof -tiTCP:${port} -sTCP:LISTEN || true`])
      out.split(/\s+/).map((s) => s.trim()).filter(Boolean).forEach((s) => { const n = Number(s); if (Number.isFinite(n)) pids.add(n) })
    } catch {}
    // Try ss
    if (pids.size === 0 && process.platform !== 'win32') {
      try {
        const out = await run('bash', ['-lc', `command -v ss >/dev/null 2>&1 && ss -ltnp '( sport = :${port} )' || true`])
        const rx = /pid=(\d+)/g
        let m; while ((m = rx.exec(out))) { const n = Number(m[1]); if (Number.isFinite(n)) pids.add(n) }
      } catch {}
    }
    for (const pid of pids) {
      console.log(`Killing PID ${pid} on port ${port}`)
      await tryKill(pid)
    }
  }
}

function writeMeta(name, val) {
  ensureRunDir()
  try { fs.writeFileSync(path.join(RUN_DIR, name), String(val)) } catch {}
}

async function isPortBusy(port) {
  const run = (cmd, args) => new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] })
    let out = ''
    p.stdout.on('data', (b) => { out += b.toString('utf8') })
    p.on('exit', () => resolve(out))
  })
  if (process.platform === 'win32') {
    const out = await run('powershell.exe', ['-NoProfile', `Get-NetTCPConnection -LocalPort ${port} | Measure-Object | Select-Object -ExpandProperty Count`])
    const n = Number(String(out || '').trim()); return Number.isFinite(n) && n > 0
  } else {
    const out = await run('bash', ['-lc', `command -v lsof >/dev/null 2>&1 && lsof -tiTCP:${port} -sTCP:LISTEN | wc -l || echo 0`])
    const n = Number(String(out || '').trim()); return Number.isFinite(n) && n > 0
  }
}

function loadEnvFile(file) {
  const env = {}
  try {
    const s = fs.readFileSync(file, 'utf8')
    s.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) return
      const key = m[1]
      let val = m[2]
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    })
  } catch {}
  return env
}

main().catch((e) => { console.error(e); process.exit(1) })
