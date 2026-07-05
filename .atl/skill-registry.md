# Skill Registry

This registry tracks the capabilities and standard workflows available for the dev-tracker project.
Agents should load these skills using `skill_view(name)` when the trigger conditions are met.

## Software Development & Architecture

| Skill | Trigger / When to load |
|-------|------------------------|
| `software-development/project-doctrine` | ALWAYS LOAD BEFORE modifying architecture, adding domains, writing new modules, or creating tests. Defines Hexagonal + Atomic Design rules. |
| `software-development/test-driven-development` | RED-GREEN-REFACTOR. Enforce test-driven workflows. |
| `software-development/typescript-refactoring` | TypeScript refactoring techniques and pitfalls. |
| `software-development/node-cookie-auth-patterns` | Working with authentication, session cookies, and proxies. |
| `devops/dockerfile-for-node-stack` | Building production-ready Docker images for the stack. |
| `github/github-pr-workflow` | Creating and managing pull requests. |
| `judgment-day` | Adversarial review of technical design or implementation. |

## SDD Pipeline (Software Design Document Workflow)

These skills drive the structured development phases.

| Skill | Phase / Purpose |
|-------|-----------------|
| `sdd-init` | Initialize SDD context, testing capabilities, registry, and persistence. |
| `sdd-explore` | Explore SDD ideas before committing to a change. |
| `sdd-propose` | Create an SDD change proposal with intent, scope, and approach. |
| `sdd-spec` | Write SDD delta specs with requirements and scenarios. |
| `sdd-design` | Create the SDD technical design and architecture approach. |
| `sdd-tasks` | Break an SDD change into implementation tasks. |
| `sdd-apply` | Implement SDD tasks from specs and design. |
| `sdd-verify` | Execute the SDD verification phase, verify change. |
| `sdd-archive` | Archive a completed SDD change by syncing delta specs. |

## Agent Conduct

| Skill | Purpose |
|-------|---------|
| `agent-conduct/consent-before-mutation` | Required before destructive operations (git rm, force push, batched deletes). |
| `agent-conduct/agent-tooling-discipline` | Handling exact command failures and repeated failures. |

> Note: To read a skill, run `skill_view('skill-name')`. Use exact names listed above.
