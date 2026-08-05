import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface LogEntry {
  tool: string
  ok: boolean
  duration_ms: number
}

export function resolveLogPath(): string {
  if (process.env.MCP_LOG_PATH) {
    return process.env.MCP_LOG_PATH
  }
  const baseDir = process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state')
  return path.join(baseDir, 'mcp-server', 'requests.jsonl')
}

export function isLoggingEnabled(): boolean {
  const envVal = process.env.MCP_LOG_ENABLED
  if (envVal === 'false' || envVal === '0') {
    return false
  }
  return true
}

export function logRequest(entry: LogEntry): void {
  if (!isLoggingEnabled()) {
    return
  }

  try {
    const filePath = resolveLogPath()
    const dirPath = path.dirname(filePath)

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const record = {
      ts: new Date().toISOString(),
      tool: entry.tool,
      ok: entry.ok,
      duration_ms: Math.round(entry.duration_ms * 100) / 100,
    }

    fs.appendFileSync(filePath, JSON.stringify(record) + '\n', 'utf-8')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Failed to write request log: ${msg}`)
  }
}
