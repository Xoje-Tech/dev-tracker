# mcp-server Specification

## Purpose

Natively expose dev-tracker operations as tools for AI agents using the Model Context Protocol (MCP). The MCP server acts as an HTTP client wrapping the Express backend, providing tools to read and mutate projects and tasks, and returning intelligent error context for self-correction.

## Requirements

### Requirement: MCP Server Transport

The system MUST implement an MCP server using the `@modelcontextprotocol/sdk` configured with the `stdio` transport.

#### Scenario: Agent connects to server
- GIVEN the MCP server is launched via the CLI
- WHEN an AI agent initiates an MCP connection via `stdio`
- THEN the server MUST respond with its capabilities including the `tools` capability.

#### Scenario: Server logging
- GIVEN the MCP server is running
- WHEN internal events or errors occur
- THEN the server MUST log to `stderr` and MUST NOT write to `stdout` to avoid protocol corruption.

### Requirement: Tool Exposure and Validation

The system MUST expose dev-tracker operations as MCP tools, validating inputs and wrapping the Express API.

#### Scenario: List Projects Tool
- GIVEN a valid MCP connection
- WHEN the agent calls `list_projects` with no inputs
- THEN the server MUST GET `/api/projects` and return the list formatted as an MCP text content response.

#### Scenario: Get Project Board Tool
- GIVEN a valid project ID
- WHEN the agent calls `get_project_board` with `{ "projectId": "uuid" }`
- THEN the server MUST GET `/api/projects/:id/board` and return the project columns and tasks.

#### Scenario: Create Project Tool
- GIVEN a valid project name
- WHEN the agent calls `create_project` with `{ "name": "New Project" }`
- THEN the server MUST POST to `/api/projects` and return the created project ID.

#### Scenario: Create Task Tool
- GIVEN valid task details
- WHEN the agent calls `create_task` with `{ "projectId": "uuid", "title": "Task", "description": "...", "columnId": "uuid" }`
- THEN the server MUST POST to `/api/tasks` and return the created task ID.

#### Scenario: Move Task Tool
- GIVEN a valid task and target column
- WHEN the agent calls `move_task` with `{ "taskId": "uuid", "columnId": "uuid" }`
- THEN the server MUST PUT to `/api/tasks/:id/move` and return a success message.

### Requirement: Intelligent Errors

The system MUST catch all backend HTTP errors and validation failures, returning them as `isError: true` responses containing context to help the agent self-correct.

#### Scenario: Tool input validation failure
- GIVEN a tool call
- WHEN the agent provides invalid input arguments that fail schema validation
- THEN the server MUST return an MCP error response detailing the missing or invalid fields.

#### Scenario: Backend returns validation or business error
- GIVEN the `move_task` tool is called
- WHEN the Express API returns a 400 Bad Request (e.g., "Invalid column ID")
- THEN the server MUST return `isError: true`
- AND the content MUST include actionable context (e.g., "Available column IDs for this project are: ...").