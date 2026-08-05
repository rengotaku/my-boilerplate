import { AppError, ERROR_CODES } from '../errors.js'
import type { ToolResult } from './echo.js'

export const textStatsTool = {
  name: 'text_stats',
  description: 'Calculate character and line counts for the input text',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text to analyze',
      },
    },
    required: ['text'],
  },
  handler: (args?: Record<string, unknown>): ToolResult => {
    if (!args || typeof args.text !== 'string') {
      throw new AppError(ERROR_CODES.VALIDATION, 'Parameter "text" must be a string')
    }
    const lines = args.text.split('\n').length
    const characters = args.text.length
    const result = { characters, lines }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    }
  },
}
