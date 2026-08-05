import { describe, it, expect } from 'vitest'
import { listTools, callTool, registerTool, createServer } from '../src/server.js'
import { AppError, ERROR_CODES } from '../src/errors.js'

describe('MCP Server STEP B Tests', () => {
  // T1 ListTools 完全性
  it('T1 ListTools 完全性', async () => {
    const res = await listTools()
    expect(res).toHaveProperty('tools')
    expect(Array.isArray(res.tools)).toBe(true)
    expect(res.tools.length).toBeGreaterThanOrEqual(2)

    const echoTool = res.tools.find((t) => t.name === 'echo')
    expect(echoTool).toBeDefined()
    expect(echoTool?.description).toBeTruthy()
    expect(echoTool?.inputSchema).toEqual(
      expect.objectContaining({
        type: 'object',
      }),
    )

    const textStatsTool = res.tools.find((t) => t.name === 'text_stats')
    expect(textStatsTool).toBeDefined()
    expect(textStatsTool?.description).toBeTruthy()
    expect(textStatsTool?.inputSchema).toEqual(
      expect.objectContaining({
        type: 'object',
      }),
    )
  })

  // T2 CallTool 成功
  it('T2 CallTool 成功', async () => {
    const res = await callTool('echo', { text: 'hello world' })
    expect(res.isError).not.toBe(true)
    expect(res.content).toBeDefined()
    expect(res.content[0].type).toBe('text')
    expect(res.content[0].text).toBe('hello world')
  })

  // T3 未知 tool
  it('T3 未知 tool', async () => {
    const res = await callTool('non_existent_tool', {})
    expect(res.isError).toBe(true)
    expect(res.content).toBeDefined()

    const payload = JSON.parse(res.content[0].text)
    expect(payload.code).toBe(ERROR_CODES.UNKNOWN_TOOL)
  })

  // T4 ハンドラ例外の変換
  it('T4 ハンドラ例外の変換', async () => {
    // AppError を throw するテスト用 tool
    registerTool({
      name: 'test_app_error',
      description: 'Throws AppError for testing',
      inputSchema: { type: 'object' },
      handler: () => {
        throw new AppError('CUSTOM_CODE', 'Custom app error message')
      },
    })

    // 生 Error を throw するテスト用 tool
    registerTool({
      name: 'test_raw_error',
      description: 'Throws raw Error for testing',
      inputSchema: { type: 'object' },
      handler: () => {
        throw new Error('Something went wrong internally')
      },
    })

    // AppError の検証
    const resApp = await callTool('test_app_error', {})
    expect(resApp.isError).toBe(true)
    const payloadApp = JSON.parse(resApp.content[0].text)
    expect(payloadApp.code).toBe('CUSTOM_CODE')
    expect(payloadApp.message).toBe('Custom app error message')

    // 生 Error の検証 (INTERNAL code に変換)
    const resRaw = await callTool('test_raw_error', {})
    expect(resRaw.isError).toBe(true)
    const payloadRaw = JSON.parse(resRaw.content[0].text)
    expect(payloadRaw.code).toBe(ERROR_CODES.INTERNAL)
    expect(payloadRaw.message).toBe('Something went wrong internally')
  })

  // T5 入力バリデーション
  it('T5 入力バリデーション', async () => {
    // schema 不適合の引数 (string 期待に number や undefined)
    const resInvalid = await callTool('text_stats', { text: 12345 })
    expect(resInvalid.isError).toBe(true)

    const payloadInvalid = JSON.parse(resInvalid.content[0].text)
    expect(payloadInvalid.code).toBe(ERROR_CODES.VALIDATION)
  })

  // 追加テスト 1: CallTool text_stats 成功
  it('追加テスト: CallTool text_stats 成功', async () => {
    const res = await callTool('text_stats', { text: 'line1\nline2\nline3' })
    expect(res.isError).not.toBe(true)
    expect(res.content).toBeDefined()
    const data = JSON.parse(res.content[0].text)
    expect(data.lines).toBe(3)
    expect(data.characters).toBe(17)
  })

  // 追加テスト 2: createServer インスタンス生成
  it('追加テスト: createServer インスタンス生成', () => {
    const server = createServer()
    expect(server).toBeDefined()
  })
})
