# Design: Native MCP Server

## Technical Approach

We will implement a Model Context Protocol (MCP) server that acts as a pure transport layer over the existing Express REST API. The MCP server will use the `@modelcontextprotocol/sdk` configured with the `stdio` transport. It will expose dev-tracker operations as tools (validated using Zod) and interact with the backend via native `fetch`, utilizing API Key authentication. Any validation or backend HTTP errors will be intercepted and translated into structured `isError: true` responses with intelligent, actionable context for the AI agent to self-correct.

## Architecture Decisions

### Decision: HTTP Client for Backend Communication

**Choice**: Native Node `fetch` wrapper (`src/mcp/client.ts`).
**Alternatives considered**: Direct Prisma database access; installing `axios`.
**Rationale**: Direct Prisma access bypasses existing backend validation, auth, and logic. Native `fetch` is available in Node >=26 and avoids adding unnecessary dependencies.

### Decision: Error Handling Strategy

**Choice**: Catch all HTTP/Zod errors and return `isError: true` with contextual string hints.
**Alternatives considered**: Throwing errors and crashing the server; returning generic "HTTP 400" errors.
**Rationale**: Crashing terminates the agent's connection via `stdio`. Generic errors don't help the agent self-correct. Wrapping errors into descriptive hints (e.g., valid column IDs) fits the "Intelligent Errors" requirement and maintains connection stability.

### Decision: Transport Configuration

**Choice**: `stdio` transport via `@modelcontextprotocol/sdk`.
**Alternatives considered**: SSE (Server-Sent Events) transport.
**Rationale**: `stdio` is the standard for local agent execution (e.g., Claude Desktop, Hermes) and is explicitly requested in the spec.

## Data Flow

    Agent ──(stdio JSON-RPC)──→ MCP Server (src/mcp/index.ts)
                                      │ (Input Validation - Zod)
                                      ▼
                                MCP HTTP Client (src/mcp/client.ts)
                                      │ (HTTP requests w/ API Key)
                                      ▼
                                dev-tracker Express API

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/mcp/index.ts` | Create | MCP server entry point, sets up tools and `stdio` transport. |
| `src/mcp/tools.ts` | Create | Zod schemas and tool registration for `list_projects`, `get_project_board`, `create_project`, `create_task`, `move_task`. |
| `src/mcp/client.ts` | Create | HTTP `fetch` wrapper configured for the Express backend and API Key. |
| `src/mcp/errors.ts` | Create | Helpers to format HTTP error responses into intelligent MCP error context. |
| `package.json` | Modify | Add `@modelcontextprotocol/sdk` to dependencies; add `"mcp": "tsx src/mcp/index.ts"` to scripts. |

## Interfaces / Contracts

```typescript
// MCP Tool Error Response Pattern
interface McpToolResponse {
  content: Array<{ type: "text", text: string }>;
  isError?: boolean;
}

// Client config
interface McpClientConfig {
  baseUrl: string; // e.g., http://localhost:3000/api via DEV_TRACKER_API_URL
  apiKey: string;  // passed via DEV_TRACKER_API_KEY
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Zod Tool Schemas | Validate input acceptance and rejection. |
| Unit | Error Formatter | Ensure backend errors are translated to helpful string contexts. |
| Integration | MCP Handlers | Mock HTTP client and invoke tool handlers, checking returned JSON structures. |

## Migration / Rollout

No migration required. This is an additive external interface that does not alter database schemas or existing Express routes.

## Open Questions

- None.
