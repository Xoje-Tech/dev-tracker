# Tasks: MCP Server Implementation

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | MCP Server Implementation | PR 1 | Base branch; all changes included |

## Phase 1: Foundation and Dependencies

- [x] 1.1 `package.json`: Add `@modelcontextprotocol/sdk` and `zod` dependencies, and `mcp` start script.
- [x] 1.2 `src/mcp/errors.test.ts`: Write unit tests for HTTP error formatting and intelligent hint generation.
- [x] 1.3 `src/mcp/errors.ts`: Implement error formatting logic and `isError: true` wrapper.
- [x] 1.4 `src/mcp/client.test.ts`: Write unit tests for the native `fetch` HTTP wrapper (mocking fetch).
- [x] 1.5 `src/mcp/client.ts`: Implement `McpClient` to wrap Express API calls with `DEV_TRACKER_API_KEY`.

## Phase 2: Tool Schemas and Handlers

- [x] 2.1 `src/mcp/tools.test.ts`: Write unit tests for Zod schemas (`list_projects`, `get_project_board`, `create_project`, `create_task`, `move_task`) validating inputs.
- [x] 2.2 `src/mcp/tools.test.ts`: Write unit tests for tool execution handlers interacting with the mocked `McpClient`.
- [x] 2.3 `src/mcp/tools.ts`: Implement Zod schemas and register tool handlers invoking the HTTP client.

## Phase 3: Server Entrypoint and Integration

- [x] 3.1 `src/mcp/index.test.ts`: Write integration tests simulating `stdio` transport tool calls and verifying JSON-RPC responses.
- [x] 3.2 `src/mcp/index.ts`: Implement MCP server entrypoint, configure `stdio` transport, and wire tool handlers.
- [x] 3.3 Verify server only logs to `stderr` to prevent protocol corruption over `stdio`.
