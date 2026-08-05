import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { callTool } from '../src/server.js'
import { resolveLogPath, isLoggingEnabled } from '../src/logging.js'

describe('MCP Server STEP C Tests', () => {
  let tmpDir: string
  let logFile: string
  const originalEnv = { ...process.env }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'))
    logFile = path.join(tmpDir, 'test-requests.jsonl')
    process.env.MCP_LOG_PATH = logFile
    process.env.MCP_LOG_ENABLED = 'true'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  // T6 JSONL ログ
  it('T6 JSONL ログ', async () => {
    // (a) 有効化して callTool 2 回
    process.env.MCP_LOG_ENABLED = 'true'
    await callTool('echo', { text: 'test 1' })
    await callTool('echo', { text: 'test 2' })

    expect(fs.existsSync(logFile)).toBe(true)
    const linesA = fs.readFileSync(logFile, 'utf-8').trim().split('\n').filter(Boolean)
    expect(linesA.length).toBe(2)

    for (const line of linesA) {
      const parsed = JSON.parse(line)
      expect(parsed).toHaveProperty('ts')
      expect(parsed).toHaveProperty('tool', 'echo')
      expect(parsed).toHaveProperty('ok', true)
      expect(parsed).toHaveProperty('duration_ms')
      expect(new Date(parsed.ts).toISOString()).toBe(parsed.ts)
      expect(typeof parsed.duration_ms).toBe('number')
    }

    // (b) 無効化して 1 回
    process.env.MCP_LOG_ENABLED = 'false'
    await callTool('echo', { text: 'test 3' })

    const linesB = fs.readFileSync(logFile, 'utf-8').trim().split('\n').filter(Boolean)
    expect(linesB.length).toBe(2)

    // (c) 書き込み不能パスで 1 回
    process.env.MCP_LOG_ENABLED = 'true'
    const invalidLogPath = path.join(
      tmpDir,
      'non_existent_dir_is_file',
      'sub',
      'log.jsonl',
    )
    fs.writeFileSync(
      path.join(tmpDir, 'non_existent_dir_is_file'),
      'I am a file, not a directory',
    )
    process.env.MCP_LOG_PATH = invalidLogPath

    const res = await callTool('echo', { text: 'test fallback' })
    expect(res.isError).not.toBe(true)
    expect(res.content[0].text).toBe('test fallback')
  })

  // 追加テスト: resolveLogPath と isLoggingEnabled の判定検証
  it('追加テスト: logging 単体機能検証', () => {
    delete process.env.MCP_LOG_PATH
    delete process.env.XDG_STATE_HOME
    delete process.env.MCP_LOG_ENABLED

    expect(isLoggingEnabled()).toBe(true)
    expect(resolveLogPath()).toContain('.local/state/mcp-server/requests.jsonl')

    process.env.MCP_LOG_ENABLED = '0'
    expect(isLoggingEnabled()).toBe(false)
  })
})
