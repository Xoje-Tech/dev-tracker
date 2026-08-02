import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { McpClient } from './client.js';
import { executeTool } from './tools.js';
import { formatMcpError, formatZodError } from './errors.js';
import { ZodError } from 'zod';

export function setupServer() {
  const server = new Server(
    {
      name: 'dev-tracker-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Configure the McpClient to use the local backend URL
  const client = new McpClient(
    process.env.DEV_TRACKER_API_URL || 'http://localhost:6789/api', // Changed port to 6789
    process.env.DEV_TRACKER_API_KEY || '',
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_projects',
          description: 'List all projects',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_project_board',
          description: 'Get board for project',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
          },
        },
        {
          name: 'create_project_board',
          description: 'Create a default board for a project',
          inputSchema: {
            type: 'object',
            properties: { projectId: { type: 'string' } },
            required: ['projectId'],
          },
        },
        {
          name: 'create_project',
          description: 'Create project',
          inputSchema: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
        },
        {
          name: 'create_task',
          description: 'Create task',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              columnId: { type: 'string' },
            },
            required: ['projectId', 'title', 'columnId'],
          },
        },
        {
          name: 'move_task',
          description: 'Move task to column',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              columnId: { type: 'string' },
            },
            required: ['taskId', 'columnId'],
          },
        },
        {
          name: 'update_task',
          description:
            'Update task properties (title, description, priority, assigneeId)',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              assigneeId: { type: 'string' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'delete_task',
          description: 'Delete a task by ID',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
            },
            required: ['taskId'],
          },
        },
        // ─────────────── Milestone tools (6) ───────────────
        {
          name: 'list_milestones',
          description: 'List milestones for a project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              includeArchived: { type: 'boolean' },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'get_milestone',
          description: 'Get a single milestone by id',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              milestoneId: { type: 'string' },
            },
            required: ['projectId', 'milestoneId'],
          },
        },
        {
          name: 'create_milestone',
          description: 'Create a milestone in a project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string', format: 'date-time' },
            },
            required: ['projectId', 'title'],
          },
        },
        {
          name: 'update_milestone',
          description:
            'Update milestone fields (title, description, dueDate, status)',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              milestoneId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              dueDate: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'string', enum: ['open', 'closed', 'archived'] },
            },
            required: ['projectId', 'milestoneId'],
          },
        },
        {
          name: 'delete_milestone',
          description: 'Hard-delete a milestone by id',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              milestoneId: { type: 'string' },
            },
            required: ['projectId', 'milestoneId'],
          },
        },
        {
          name: 'archive_milestone',
          description: 'Soft-archive a milestone (status=archived, idempotent)',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              milestoneId: { type: 'string' },
            },
            required: ['projectId', 'milestoneId'],
          },
        },
        // ─────────────── Sprint tools (5) ───────────────
        {
          name: 'list_sprints',
          description: 'List sprints for a project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'get_sprint',
          description: 'Get a single sprint by id',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              sprintId: { type: 'string' },
            },
            required: ['projectId', 'sprintId'],
          },
        },
        {
          name: 'create_sprint',
          description: 'Create a sprint, optionally linked to a milestone',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              milestoneId: { type: 'string' },
            },
            required: ['projectId', 'name'],
          },
        },
        {
          name: 'update_sprint',
          description:
            'Update sprint fields (name, description, milestoneId — pass null to detach)',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              sprintId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              milestoneId: { type: 'string', nullable: true },
            },
            required: ['projectId', 'sprintId'],
          },
        },
        {
          name: 'delete_sprint',
          description: 'Hard-delete a sprint by id',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              sprintId: { type: 'string' },
            },
            required: ['projectId', 'sprintId'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await executeTool(
        client,
        request.params.name,
        request.params.arguments ?? {},
      );
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return formatZodError(error);
      }
      return formatMcpError(
        error instanceof Error ? error.message : String(error),
      );
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
  console.error('MCP Server running on stdio');
}

if (
  import.meta.url.startsWith('file:') &&
  process.argv[1] === new URL(import.meta.url).pathname
) {
  run().catch(console.error);
}
