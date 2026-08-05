import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { AppError, ERROR_CODES } from './errors.js'
import { logRequest } from './logging.js'
import { echoTool } from './tools/echo.js'
import { textStatsTool } from './tools/textStats.js'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (
    args?: Record<string, unknown>,
  ) =>
    | Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>
    | { content: Array<{ type: string; text: string }>; isError?: boolean }
}

const toolRegistry = new Map<string, ToolDefinition>()

export function registerTool(tool: ToolDefinition): void {
  toolRegistry.set(tool.name, tool)
}

// デフォルトツールを登録
registerTool(echoTool)
registerTool(textStatsTool)

export async function listTools(): Promise<{ tools: Tool[] }> {
  const tools: Tool[] = Array.from(toolRegistry.values()).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema as Tool['inputSchema'],
  }))
  return { tools }
}

export async function callTool(
  name: string,
  args?: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const startTime = Date.now()
  const tool = toolRegistry.get(name)

  if (!tool) {
    const result = {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: ERROR_CODES.UNKNOWN_TOOL,
            message: `Unknown tool: ${name}`,
          }),
        },
      ],
    }
    logRequest({ tool: name, ok: false, duration_ms: Date.now() - startTime })
    return result
  }

  try {
    const result = await tool.handler(args)
    const isOk = !('isError' in result && result.isError)
    logRequest({ tool: name, ok: isOk, duration_ms: Date.now() - startTime })
    return result
  } catch (err) {
    let result: { content: Array<{ type: string; text: string }>; isError: boolean }
    if (err instanceof AppError) {
      result = {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: err.code,
              message: err.message,
            }),
          },
        ],
      }
    } else {
      const message = err instanceof Error ? err.message : String(err)
      result = {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: ERROR_CODES.INTERNAL,
              message,
            }),
          },
        ],
      }
    }
    logRequest({ tool: name, ok: false, duration_ms: Date.now() - startTime })
    return result
  }
}

export function createServer(): Server {
  const server = new Server(
    {
      name: 'mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return listTools()
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return callTool(request.params.name, request.params.arguments)
  })

  return server
}
