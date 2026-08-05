import { AppError, ERROR_CODES } from '../errors.js'

export interface ToolContent {
  type: string
  text: string
}

export interface ToolResult {
  content: ToolContent[]
  isError?: boolean
}

export const echoTool = {
  name: 'echo',
  description: 'Echo back the input text',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text to echo back',
      },
    },
    required: ['text'],
  },
  handler: (args?: Record<string, unknown>): ToolResult => {
    if (!args || typeof args.text !== 'string') {
      throw new AppError(ERROR_CODES.VALIDATION, 'Parameter "text" must be a string')
    }
    return {
      content: [
        {
          type: 'text',
          text: args.text,
        },
      ],
    }
  },
}
