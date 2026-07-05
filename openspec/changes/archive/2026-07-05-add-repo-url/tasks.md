# Tasks: Add Repository URL to Project

- [x] 1. Database & Prisma Migration
* Update `schema.prisma` to include `repositoryUrl` (optional string) on the `Project` model.
* Run `prisma db push` (or generate migration) to apply the schema change.

- [x] 2. Backend DTO Updates & Tests
* Update `CreateProjectDto` to accept `repositoryUrl`.
* Update `UpdateProjectDto` to accept `repositoryUrl`.
* Update `ProjectResponseDto` to include `repositoryUrl`.
* Add/update validation tests for DTO changes.

- [x] 3. Backend Mappers & Repository Update
* Update project mapper(s) to map the `repositoryUrl` field between domain, persistence, and response objects.
* Update the project repository to handle saving and retrieving the `repositoryUrl` field.

- [x] 4. Frontend Types & Store Update
* Update frontend `Project` type/interface to include `repositoryUrl`.
* Update API request payload types for creating/updating projects.
* Ensure state management/store handles the new field correctly.

- [x] 5. Frontend Components Update
* Update `NewProjectForm` to include an input field for `repositoryUrl`.
* Update `ProjectCard` (and/or Project Details view) to display the repository URL as a clickable link if present.