# Breadly Monorepo

Breadly is a recipe management application built as a monorepo with an API-first architecture.

## Project Structure

| Directory | Purpose | Tech Stack |
|-----------|---------|------------|
| `breadly-api/` | OpenAPI spec — single source of truth for all API types | OpenAPI 3.1, Redocly |
| `breadly-backend/` | REST API server | Express 5, TypeScript, MongoDB, Jest |
| `breadly-frontend/` | Single-page application | Angular 21, TypeScript, Tailwind CSS v4, Vitest |
| `infrastructure/` | Deployment infrastructure | Terraform (AWS), Docker Compose (local) |
| `docs/` | Project documentation | Markdown |

## API-First Principle

The OpenAPI spec in `breadly-api/openapi.yaml` is the **single source of truth** for all API types and contracts. Both frontend and backend generate their types from it.

- Never hand-write API DTOs in either project
- Changes to API types always start in `openapi.yaml`
- Generated code directories (`*/generated/`) are never manually edited

## Architecture References

Each sub-project has its own `AGENTS.md` with detailed architecture rules:

- **Frontend conventions:** `breadly-frontend/AGENTS.md` — Angular component architecture, signals, smart/dumb split, styling, testing
- **Backend conventions:** `breadly-backend/AGENTS.md` — Express layering, feature structure, error handling, testing

These documents are the authoritative source for coding conventions within each project.

## Verification Commands

| Project | Lint | Build | Test | Generate API |
|---------|------|-------|------|--------------|
| `breadly-api/` | `npm run lint` | — | — | — |
| `breadly-frontend/` | `npm run lint` | `npm run build` | `npm test` | `npm run generate-api` |
| `breadly-backend/` | `npm run lint` | `npm run build` | `npm test` | `npm run generate-api` |

## Development Pipeline

When implementing features, follow this pipeline in order. Use smart skipping to omit phases that are clearly not relevant to the current task.

### Phase 1: API Contract (breadly-api/)

Skip this phase if the task does not involve API changes (e.g., pure styling, refactoring internals, fixing tests).

1. Update `openapi.yaml` in `breadly-api/` with new or changed endpoints, request/response schemas
2. Validate the spec: run `npm run lint` in `breadly-api/`
3. Generate frontend types: run `npm run generate-api` in `breadly-frontend/`
4. Generate backend types: run `npm run generate-api` in `breadly-backend/`

Do NOT begin implementation until the spec is valid and types are generated.

### Phase 2: Implementation

Follow the conventions defined in each project's AGENTS.md.

5. **Backend** (if applicable): implement controller, service, and model in `breadly-backend/src/features/<name>/`. Controller handles HTTP only, service contains business logic. Use generated DTOs.
6. **Frontend** (if applicable): implement feature service, containers/pages, and components in `breadly-frontend/src/app/features/<name>/`. Follow the smart/dumb component split. Feature services wrap generated API services.

### Phase 3: Verification (per-project)

Run verification commands in each affected project separately. Skip projects that were not modified.

7. **Write tests:**
   - Backend: unit tests for services (`<name>.service.spec.ts`), integration tests for controllers (`<name>.controller.spec.ts`), create `.controller.http` file
   - Frontend: tests per component type as defined in `breadly-frontend/AGENTS.md` section 17

8. **Lint** (per-project, only in affected projects):
   - `npm run lint` in `breadly-frontend/`
   - `npm run lint` in `breadly-backend/`

9. **Build** (per-project, only in affected projects):
   - `npm run build` in `breadly-frontend/`
   - `npm run build` in `breadly-backend/`

10. **Test** (per-project, only in affected projects):
    - `npm test` in `breadly-frontend/`
    - `npm test` in `breadly-backend/`

If any step fails, fix the issue before proceeding to the next step.

### Phase 4: Code Review

11. After all verification passes, invoke the `code-reviewer` sub-agent via the Task tool to review all changes made in phases 1-3. Pass it a description of what was changed and which files were affected.
12. If the code-reviewer applied fixes, re-run Phase 3 verification (lint, build, test) on the affected projects to ensure the fixes did not introduce regressions.

### Smart Skipping Rules

- **Pure frontend changes:** skip backend lint/build/test
- **Pure backend changes:** skip frontend lint/build/test
- **No API changes:** skip Phase 1 entirely
- **Documentation-only changes:** skip all phases, no review needed
- **Test-only changes:** skip Phase 1, run only test-related verification
- **Lint/formatting fixes:** skip Phase 1, skip Phase 4 (no review needed for formatting)

## Code Review

All substantial code changes are reviewed by the `code-reviewer` sub-agent after implementation and verification. The code-reviewer enforces the conventions defined in each project's `AGENTS.md` and focuses on readability, maintainability, component slicing, and testability.
