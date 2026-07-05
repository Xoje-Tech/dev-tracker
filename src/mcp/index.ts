import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { McpClient } from "./client.js";
import { executeTool } from "./tools.js";
import { formatMcpError, formatZodError } from "./errors.js";
import { ZodError } from "zod";

export function setupServer() {
  const server = new Server(
    {
      name: "dev-tracker-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const client = new McpClient(
    process.env.DEV_TRACKER_API_URL || "http://localhost:3000/api",
    process.env.DEV_TRACKER_API_KEY || ""
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_projects",
          description: "List all projects",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_project_board",
          description: "Get board for project",
          inputSchema: {
            type: "object",
            properties: { projectId: { type: "string" } },
            required: ["projectId"],
          },
        },
        {
          name: "create_project",
          description: "Create project",
          inputSchema: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
        },
        {
          name: "create_task",
          description: "Create task",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              columnId: { type: "string" },
            },
            required: ["projectId", "title", "columnId"],
          },
        },
        {
          name: "move_task",
          description: "Move task to column",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string" },
              columnId: { type: "string" },
            },
            required: ["taskId", "columnId"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await executeTool(client, request.params.name, request.params.arguments);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return formatZodError(error);
      }
      return formatMcpError(error.message);
    }
  });

  return server;
}

export async function run() {
  // Only log to stderr to prevent stdio transport corruption
  console.log = console.error;

  const server = setupServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

if (import.meta.url.startsWith("file:") && process.argv[1] === new URL(import.meta.url).pathname) {
  run().catch(console.error);
}
