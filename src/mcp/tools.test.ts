import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTool } from './tools';
import { McpClient } from './client';

vi.mock('./client', () => {
  const McpClient = vi.fn();
  McpClient.prototype.get = vi.fn();
  McpClient.prototype.post = vi.fn();
  McpClient.prototype.patch = vi.fn();
  McpClient.prototype.delete = vi.fn();
  return { McpClient };
});

describe('MCP Tools', () => {
  let client: McpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new McpClient('http://localhost:3000/api', '');
  });

  describe('executeTool', () => {
    it('list_projects calls GET /projects', async () => {
      await executeTool(client, 'list_projects', {});
      expect(client.get).toHaveBeenCalledWith('/projects');
    });

    it('get_project_board calls GET /boards/:projectId/board', async () => {
      await executeTool(client, 'get_project_board', { projectId: 'p1' });
      // Backend route is /api/boards/:projectId/board (see BOARD_ROUTES)
      expect(client.get).toHaveBeenCalledWith('/boards/p1/board');
    });

    it('create_project_board calls POST /boards/:projectId/board', async () => {
      await executeTool(client, 'create_project_board', { projectId: 'p1' });
      expect(client.post).toHaveBeenCalledWith('/boards/p1/board', {});
    });

    it('create_project calls POST /projects', async () => {
      const args = { name: 'New Project' };
      await executeTool(client, 'create_project', args);
      expect(client.post).toHaveBeenCalledWith('/projects', args);
    });

    it('create_task calls POST /tasks', async () => {
      const args = {
        projectId: 'p1',
        title: 'Task',
        columnId: 'c1',
        description: '',
      };
      await executeTool(client, 'create_task', args);
      expect(client.post).toHaveBeenCalledWith('/tasks', args);
    });

    it('move_task calls POST /tasks/:taskId/move', async () => {
      await executeTool(client, 'move_task', { taskId: 't1', columnId: 'c2' });
      expect(client.post).toHaveBeenCalledWith('/tasks/t1/move', {
        targetColumnId: 'c2',
        newIndex: 0,
      });
    });

    it('update_task calls PATCH /tasks/:taskId', async () => {
      await executeTool(client, 'update_task', {
        taskId: 't1',
        title: 'New Title',
      });
      expect(client.patch).toHaveBeenCalledWith('/tasks/t1', {
        title: 'New Title',
      });
    });

    it('delete_task calls DELETE /tasks/:taskId', async () => {
      await executeTool(client, 'delete_task', { taskId: 't1' });
      expect(client.delete).toHaveBeenCalledWith('/tasks/t1');
    });

    // ─────────────── Milestone tools ───────────────

    it('list_milestones calls GET /projects/:projectId/milestones', async () => {
      await executeTool(client, 'list_milestones', { projectId: 'p1' });
      expect(client.get).toHaveBeenCalledWith('/projects/p1/milestones');
    });

    it('list_milestones with includeArchived appends query string', async () => {
      await executeTool(client, 'list_milestones', {
        projectId: 'p1',
        includeArchived: true,
      });
      expect(client.get).toHaveBeenCalledWith(
        '/projects/p1/milestones?includeArchived=true',
      );
    });

    it('get_milestone calls GET /projects/:projectId/milestones/:milestoneId', async () => {
      await executeTool(client, 'get_milestone', {
        projectId: 'p1',
        milestoneId: 'm1',
      });
      expect(client.get).toHaveBeenCalledWith('/projects/p1/milestones/m1');
    });

    it('create_milestone calls POST /projects/:projectId/milestones', async () => {
      await executeTool(client, 'create_milestone', {
        projectId: 'p1',
        title: 'M1',
      });
      expect(client.post).toHaveBeenCalledWith('/projects/p1/milestones', {
        title: 'M1',
      });
    });

    it('update_milestone calls PATCH /projects/:projectId/milestones/:milestoneId', async () => {
      await executeTool(client, 'update_milestone', {
        projectId: 'p1',
        milestoneId: 'm1',
        title: 'New M1',
      });
      expect(client.patch).toHaveBeenCalledWith('/projects/p1/milestones/m1', {
        title: 'New M1',
      });
    });

    it('delete_milestone calls DELETE /projects/:projectId/milestones/:milestoneId', async () => {
      await executeTool(client, 'delete_milestone', {
        projectId: 'p1',
        milestoneId: 'm1',
      });
      expect(client.delete).toHaveBeenCalledWith('/projects/p1/milestones/m1');
    });

    it('archive_milestone calls POST /projects/:projectId/milestones/:milestoneId/archive', async () => {
      await executeTool(client, 'archive_milestone', {
        projectId: 'p1',
        milestoneId: 'm1',
      });
      expect(client.post).toHaveBeenCalledWith(
        '/projects/p1/milestones/m1/archive',
        {},
      );
    });

    // ─────────────── Sprint tools ───────────────

    it('list_sprints calls GET /projects/:projectId/sprints', async () => {
      await executeTool(client, 'list_sprints', { projectId: 'p1' });
      expect(client.get).toHaveBeenCalledWith('/projects/p1/sprints');
    });

    it('get_sprint calls GET /projects/:projectId/sprints/:sprintId', async () => {
      await executeTool(client, 'get_sprint', {
        projectId: 'p1',
        sprintId: 's1',
      });
      expect(client.get).toHaveBeenCalledWith('/projects/p1/sprints/s1');
    });

    it('create_sprint calls POST /projects/:projectId/sprints', async () => {
      await executeTool(client, 'create_sprint', {
        projectId: 'p1',
        name: 'S1',
      });
      expect(client.post).toHaveBeenCalledWith('/projects/p1/sprints', {
        name: 'S1',
      });
    });

    it('update_sprint calls PATCH /projects/:projectId/sprints/:sprintId', async () => {
      await executeTool(client, 'update_sprint', {
        projectId: 'p1',
        sprintId: 's1',
        name: 'New S1',
      });
      expect(client.patch).toHaveBeenCalledWith('/projects/p1/sprints/s1', {
        name: 'New S1',
      });
    });

    it('delete_sprint calls DELETE /projects/:projectId/sprints/:sprintId', async () => {
      await executeTool(client, 'delete_sprint', {
        projectId: 'p1',
        sprintId: 's1',
      });
      expect(client.delete).toHaveBeenCalledWith('/projects/p1/sprints/s1');
    });

    it('throws on unknown tool', async () => {
      await expect(executeTool(client, 'unknown', {})).rejects.toThrow(
        'Unknown tool: unknown',
      );
    });
  });
});
