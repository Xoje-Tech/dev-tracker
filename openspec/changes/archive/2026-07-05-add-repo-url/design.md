# Design: add-repo-url

## Technical Approach

We will extend the `Project` entity to include an optional `repoUrl` string. This change spans from the database layer (Prisma schema) up to the frontend UI components (`NewProjectForm` and `ProjectCard`). The backend validation will enforce valid HTTP/HTTPS URLs via Zod, while the frontend will provide a dedicated input and conditionally render a link icon.

## Architecture Decisions

### Decision: Enforcing URL structure on the backend

**Choice**: Enforce `z.string().url()` in backend DTOs.
**Alternatives considered**: Treating it as a plain string.
**Rationale**: Ensuring valid URL structures prevents UI breakage when attempting to render clickable links on `ProjectCard`. Zod provides robust URL validation out-of-the-box.

### Decision: Optional display in UI

**Choice**: Conditionally render the repository link button/icon in `ProjectCard.vue`.
**Alternatives considered**: Reserving empty space or displaying "No repository".
**Rationale**: Rendering nothing when absent keeps the UI clean and avoids visual clutter for projects that don't need a repository link.

## Data Flow

    [Frontend: NewProjectForm] (repoUrl input)
           │
           ▼
    [Backend: Create/Update API] (Zod URL validation)
           │
           ▼
    [Application: CreateProject / UpdateProject Use Cases]
           │
           ▼
    [Infrastructure: PrismaProjectRepository]
           │
           ▼
    [Database: Project table] (repoUrl column)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `repoUrl String?` to `Project` model |
| `src/modules/projects/domain/entities/project.ts` | Modify | Add `repoUrl` property to `Project` entity |
| `src/modules/projects/application/dto/create-project-dto.ts` | Modify | Add `repoUrl: z.string().url().optional()` |
| `src/modules/projects/application/dto/update-project-dto.ts` | Modify | Add `repoUrl: z.string().url().optional()` |
| `src/modules/projects/application/dto/project-response-dto.ts` | Modify | Include `repoUrl` in the DTO schema |
| `src/modules/projects/application/use-cases/create-project.ts` | Modify | Map `repoUrl` from DTO to entity |
| `src/modules/projects/application/use-cases/update-project.ts` | Modify | Map `repoUrl` from DTO to entity |
| `src/modules/projects/infrastructure/persistence/prisma-project-repository.ts` | Modify | Ensure `repoUrl` is passed through Prisma client operations |
| `src/client/modules/projects/domain/types.ts` | Modify | Add `repoUrl?: string` to frontend `Project` interface |
| `src/client/modules/projects/interface/components/molecules/NewProjectForm.vue` | Modify | Add `<BaseInput>` bound to `repoUrl` |
| `src/client/modules/projects/interface/components/molecules/ProjectCard.vue` | Modify | Conditionally display repository link if `repoUrl` is present |

## Interfaces / Contracts

```typescript
// Updated CreateProjectDTO
export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  repoUrl: z.string().url().optional()
});

// Updated Project interface (Frontend)
export interface Project {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  // ... other fields
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Backend) | DTO Validation | Verify `CreateProjectSchema` rejects invalid strings for `repoUrl`. |
| Unit (Backend) | Use Cases | Verify `CreateProject` and `UpdateProject` pass the `repoUrl` downwards. |
| Integration | Project Repo | Ensure Prisma saves and retrieves `repoUrl` correctly. |
| Unit (Frontend) | `NewProjectForm` | Verify form input updates payload. |

## Migration / Rollout

No complex rollout needed. A standard Prisma database migration must be executed to add the `repoUrl` column.
- Run `npx prisma migrate dev --name add_repo_url` prior to restarting the backend.

## Open Questions

- None