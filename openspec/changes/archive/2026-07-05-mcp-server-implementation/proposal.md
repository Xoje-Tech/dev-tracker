# Proposal: Native MCP Server

## Intent

Expose dev-tracker's board, task, and project operations to AI agents natively by building an MCP (Model Context Protocol) server. This allows AI assistants to autonomously interact with the dev-tracker system on behalf of the user.

## Scope

### In Scope
- Setup `@modelcontextprotocol/sdk` standard stdio server implementation.
- Implement tools for listing projects, getting project boards, creating projects, creating tasks, and moving tasks.
- Build an HTTP client to communicate with the existing Express backend via API Key authentication.
- Implement "intelligent" error handling in MCP tools (returning valid options/context to assist AI self-correction).

### Out of Scope
- Direct Prisma database connections from the MCP server.
- Implementing missing backend endpoints in this PR (will be tracked as separate GitHub issues).
- SSE (Server-Sent Events) transport (sticking to stdio for now).

## Capabilities

### New Capabilities
- `mcp-server`: Natively exposes dev-tracker operations as tools for AI agents using the Model Context Protocol. Acts as an HTTP client wrapping the Express backend.

### Modified Capabilities
- None

## Approach

Create a dedicated MCP entry point using `@modelcontextprotocol/sdk` utilizing the `stdio` transport. The server will act purely as a transport/translation layer, making authenticated HTTP requests to the existing dev-tracker Express API. All tool inputs will be strictly validated via Zod. Errors from the backend will be caught and reformatted into intelligent MCP `isError: true` responses containing actionable context.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/mcp/` | New | Entry point and MCP server logic |
| `package.json` | Modified | Add `@modelcontextprotocol/sdk` dependency and run script |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing Express API endpoints | High | Log separate GitHub issues for missing backend routes; do not block the MCP PR on backend changes |
| Stdout corruption breaking MCP | Med | Strict discipline to use `console.error` for all server logging; no `console.log` |

## Rollback Plan

Revert the PR containing the MCP server addition. Since it acts as an external HTTP client to the backend, it will not corrupt the database or affect existing Express functionality. Remove the `package.json` dependencies and MCP startup scripts.

## Dependencies

- `@modelcontextprotocol/sdk`
- Existing dev-tracker Express backend

## Success Criteria

- [ ] AI agent can connect to the dev-tracker MCP server via stdio.
- [ ] Agent can list projects, boards, and tasks successfully via tools.
- [ ] On invalid tool use (e.g., wrong column ID), agent receives contextual error messages with valid options and successfully auto-corrects.
