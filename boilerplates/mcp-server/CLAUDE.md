# Development Rules for mcp-server

This project is a TypeScript MCP server boilerplate following strict design conventions.

## Tool Implementation Conventions

- **1 Tool = 1 File**: Each tool MUST be implemented in its own file under `src/tools/` and exported as a named object.
- **Error Handling (`isError` Contract)**:
  - Custom domain/validation errors MUST throw `AppError` from `src/errors.js` using an appropriate code from `ERROR_CODES`.
  - Never swallow unexpected errors; let `callTool` handle them. `callTool` converts `AppError` to `{ isError: true, content: [{ text: JSON.stringify({ code, message }) }] }` and raw errors to `ERROR_CODES.INTERNAL`.
- **Logging**:
  - Do NOT manually write request logs in tool handlers.
  - All request logging MUST flow through `logRequest` in `src/logging.ts` via `callTool`.

## Building & Testing

- Use `make test` or `npm run test` for running tests.
- Use `make ci` before completing tasks.
