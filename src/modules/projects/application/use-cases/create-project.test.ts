import { describe, it, expect, vi } from 'vitest';
import { CreateProject } from './create-project.js';
import { Project } from '@projects/domain/entities/project.js';
import type { ProjectRepository } from '@projects/domain/repositories/project-repository.js';
import type { BoardRepository } from '@boards/domain/repositories/board-repository.js';

describe('CreateProject Use Case', () => {
  it('creates a project with a repository URL and returns it', async () => {
    const mockProjectRepo = {
      create: vi.fn().mockImplementation((p: Project) => Promise.resolve(p)),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      isMember: vi.fn(),
    };
    const mockBoardRepo = {
      createWithDefaultColumns: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByProjectId: vi.fn(),
      update: vi.fn(),
    };

    const useCase = new CreateProject(
      mockProjectRepo as ProjectRepository,
      mockBoardRepo as BoardRepository,
    );

    const result = await useCase.execute(
      {
        name: 'My Project',
        description: 'Desc',
        repoUrl: 'https://github.com/my/repo',
      },
      'owner-123',
    );

    expect(mockProjectRepo.create).toHaveBeenCalled();
    const savedProject = mockProjectRepo.create.mock.calls[0][0];

    // RED: we expect the entity to have repoUrl
    expect(savedProject.repoUrl).toBe('https://github.com/my/repo');

    // RED: we expect the response DTO to have repoUrl
    expect(result.repoUrl).toBe('https://github.com/my/repo');
  });
});
