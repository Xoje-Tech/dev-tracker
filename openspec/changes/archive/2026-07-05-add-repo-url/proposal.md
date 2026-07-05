# Proposal: add-repo-url

## Intent

We need to add a `repoUrl` property to the `Project` model to link projects directly to their source code repositories. This addresses Issue #8 by allowing users to store and access repository links from the project cards.

## Scope

### In Scope
- Add `repoUrl String?` to `Project` model in `schema.prisma`.
- Generate and apply the Prisma migration.
- Update `create-project-dto.ts` and `update-project-dto.ts` with `z.string().url().optional()`.
- Update `project-response-dto.ts` to include `repoUrl`.
- Update `NewProjectForm` component to include a `repoUrl` input field.
- Update `ProjectCard` component to display the repository link if present.

### Out of Scope
- Validating if the URL points to a real/accessible repository.
- Extracting metadata from the repository (e.g., stars, latest commit).

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `projects`: Add optional `repoUrl` field to project creation, updates, and display.

## Approach

1. **Database:** Update `schema.prisma` and run `npx prisma migrate dev --name add_repo_url`.
2. **Backend Validation:** Update Zod schemas in `src/modules/projects/application/dto/` to accept and return the new field.
3. **Frontend:** Update `NewProjectForm.vue` to add a URL input, and `ProjectCard.vue` to conditionally render a link icon/button if `repoUrl` is present. Pinia store types might also need a minor update to reflect the new DTO.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `repoUrl` to `Project` |
| `src/modules/projects/application/dto/` | Modified | Update Zod DTOs |
| `src/client/modules/projects/interface/components/molecules/` | Modified | Update `NewProjectForm.vue` and `ProjectCard.vue` |
| `src/client/modules/projects/domain/types.ts` | Modified | Update Project frontend types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Invalid URLs crash backend | Low | Enforce `z.string().url()` in backend DTOs. |
| UI breaks on long URLs | Low | Ensure `ProjectCard` truncates or properly styles the link icon instead of raw URL text. |

## Rollback Plan

1. Revert Git commit for codebase changes.
2. If necessary, revert the Prisma migration by checking out the old schema and applying a down migration, or manually removing the `repoUrl` column from SQLite if local. Since it's an optional column, rolling back the code without rolling back the DB is safe.

## Dependencies

- None

## Success Criteria

- [ ] `Project` table has `repoUrl` column.
- [ ] API successfully accepts `repoUrl` on project creation and update.
- [ ] API rejects invalid URLs for `repoUrl`.
- [ ] Frontend form allows inputting a repository URL.
- [ ] Project cards display a clickable repository link when `repoUrl` is set.
