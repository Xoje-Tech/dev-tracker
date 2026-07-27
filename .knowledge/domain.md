# Core Domain — Dev Tracker

This page details the core entities and business rules of the Dev Tracker system.

## Domain Models

The application is built around the following key entities:
1. **User**: App users / developers.
2. **Project**: Projects being tracked.
3. **Board**: Kanban boards linked to projects.
4. **Column**: Columns representing kanban stages (e.g. To Do, In Progress, Done).
5. **Task**: Task cards placed in columns, with priority levels and attachments.
6. **Tag**: Tags assignable to tasks.

## Technical Architecture

The codebase strictly follows:
- **Backend**: Express + TypeScript + Prisma.
- **Frontend**: Vue 3 + Tailwind CSS + Pinia.
- Both layers enforce a hexagonal screaming structure: `src/modules/{domain_name}/{domain,application,infrastructure,interface}`.
