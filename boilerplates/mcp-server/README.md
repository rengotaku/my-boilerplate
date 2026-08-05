# mcp-server

A Model Context Protocol (MCP) server boilerplate built with TypeScript and `@modelcontextprotocol/sdk`.

## Overview

This template provides a lightweight, robust stdio-based MCP server. It includes structured tool registration, standard error handling, JSONL request logging, and full testing with Vitest.

## Directory Structure

```text
mcp-server/
├── src/
│   ├── index.ts        # Stdio entry point (connects server to stdio transport)
│   ├── server.ts       # Server initialization, tool registry, and request handlers
│   ├── errors.ts       # Custom AppError and ERROR_CODES constants
│   ├── logging.ts      # Fail-safe JSONL request logger
│   └── tools/          # Individual tool implementations
│       ├── echo.ts     # Sample echo tool
│       └── textStats.ts# Sample text analysis tool
├── tests/              # Vitest test suite
│   ├── server.test.ts
│   └── logging.test.ts
├── Makefile            # Standard build and check tasks
├── eslint.config.js    # ESLint configuration
├── package.json
└── tsconfig.json
```

## Adding a New Tool

1. Create a new file in `src/tools/` (e.g., `src/tools/myTool.ts`):
   ```typescript
   import { AppError, ERROR_CODES } from '../errors.js'
   import type { ToolResult } from './echo.js'

   export const myTool = {
     name: 'my_tool',
     description: 'Description of what my_tool does',
     inputSchema: {
       type: 'object',
       properties: {
         input: { type: 'string', description: 'Input parameter' },
       },
       required: ['input'],
     },
     handler: (args?: Record<string, unknown>): ToolResult => {
       if (!args || typeof args.input !== 'string') {
         throw new AppError(ERROR_CODES.VALIDATION, 'Parameter "input" must be a string')
       }
       return {
         content: [{ type: 'text', text: `Processed: ${args.input}` }],
       }
     },
   }
   ```
2. Register the tool in `src/server.ts`:
   ```typescript
   import { myTool } from './tools/myTool.js'

   registerTool(myTool)
   ```

## Configuration & Logging

Request logging writes single-line JSONL records (`ts`, `tool`, `ok`, `duration_ms`) on each tool invocation.
Log writing is fail-safe; filesystem errors will log to stderr without breaking tool execution.

- `MCP_LOG_ENABLED`: Enable/disable logging (`true` or `false`, default: `true`).
- `MCP_LOG_PATH`: Override log file location. Default path is `$XDG_STATE_HOME/mcp-server/requests.jsonl` (fallback: `~/.local/state/mcp-server/requests.jsonl`).

## Registering with Claude Code / MCP Clients

Add the server to your MCP client configuration (e.g. `~/.claude.json` or Claude Desktop config):

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

Make sure to run `make build` (`npm run build`) before starting the server.

## Scripts & Commands

- `make install` - Install dependencies
- `make build` - Compile TypeScript to `dist/`
- `make test` - Run tests with Vitest
- `make check` - Run linter and tests
- `make ci` - Full CI check (lint, format-check, typecheck, coverage, build)
