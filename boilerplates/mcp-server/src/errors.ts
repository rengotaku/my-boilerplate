export const ERROR_CODES = {
  UNKNOWN_TOOL: 'UNKNOWN_TOOL',
  VALIDATION: 'VALIDATION',
  INTERNAL: 'INTERNAL',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export class AppError extends Error {
  readonly code: ErrorCode | string

  constructor(code: ErrorCode | string, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
