# Breadly Monorepo

Breadly is a recipe management application built as a monorepo with an API-first architecture.

## Project Structure

| Directory | Purpose | Tech Stack |
|-----------|---------|------------|
| `breadly-api/` | OpenAPI spec — single source of truth for all API types | OpenAPI 3.1, Redocly |
| `breadly-backend/` | REST API server | Express 5, TypeScript, MongoDB, Jest |
| `breadly-frontend/` | Single-page application | Angular 21, TypeScript, Tailwind CSS v4, Vitest |
| `e2e/` | End-to-end tests against deployed preview environments | Playwright, TypeScript, Vitest |
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

| Project | Lint | Build | Test (one-shot) | Generate API |
|---------|------|-------|-----------------|--------------|
| `breadly-api/` | `npm run lint` | — | — | — |
| `breadly-frontend/` | `npm run lint` | `npm run build` | `npm run test:ci` | `npm run generate-api` |
| `breadly-backend/` | `npm run lint` | `npm run build` | `npm test` | `npm run generate-api` |
| `e2e/` | — | — | `npm test` (Playwright) | — |

> **Note:** `npm test` in `breadly-frontend/` starts a watch-mode server. Always use `npm run test:ci` for one-shot runs in scripts and automation.

## Mandatory Test Rule

**After every code change — no exceptions — run tests in all affected projects before marking the task done.** This applies to all change types: features, bug fixes, refactors, design-token updates, dependency bumps, and test-only edits.

- Any change to `breadly-frontend/` → run `npm run test:ci` in `breadly-frontend/`
- Any change to `breadly-backend/` → run `npm test` in `breadly-backend/`
- Both must be green (zero failures) before the work is considered complete

If tests break after a change, fix them immediately — do not commit or hand off until all tests pass.

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

### Phase 4: E2E Tests (e2e/)

Skip this phase **only** for pure refactoring, documentation-only changes, test-only changes, or lint/formatting fixes. All new user-facing features **must** include E2E coverage. All changes to user-facing behavior **must** update affected E2E tests.

11. **Write or update E2E tests** as needed:
    - **New features:** create at least one happy-path user journey spec in `e2e/tests/<feature>/`.
    - **Changed behavior:** update existing Page Objects and specs to match the new UI (e.g., moved elements, renamed selectors, changed navigation flows).
    - **Removed features:** remove or update specs that relied on the removed behavior.

12. **Run E2E tests** (`npm test` in `e2e/`) to verify changes. E2E tests run against a deployed preview environment (configured via `E2E_BASE_URL` in `e2e/.env`). If the preview environment does not yet include the current changes, verify at minimum that the E2E test code is consistent with the frontend changes (Page Object selectors match `data-testid` attributes, navigation flows match the updated UI).

#### What to test in E2E vs unit/integration tests

| Test Level | Scope | Examples |
|-----------|-------|---------|
| **E2E (Playwright)** | Happy-path user journeys, core workflows end-to-end | Create a recipe, navigate between pages, sign in/out |
| **Unit / Integration** | Edge cases, validation errors, error handling, boundary conditions | Empty form submission, 404 responses, malformed input, permission denied |

E2E tests validate that the **most common user journeys** work correctly across the full stack (frontend + backend + infrastructure). They are not the place for exhaustive error-case coverage — that belongs in unit and integration tests.

#### One journey per spec

Each spec file must contain **exactly one `test()`** that chains all user actions for that feature in a single sequential journey. Do not split a feature's behaviour across multiple `test()` blocks — this produces isolated action tests, not user journeys.

**Before (incorrect — 3 separate tests):**
```ts
test('admin sees health data', async ({ page }) => { /* navigate + assert */ });
test('admin can reload data', async ({ page }) => { /* navigate + reload + assert */ });
test('admin page persists on reload', async ({ page }) => { /* navigate + page.reload + assert */ });
```

**After (correct — one chained journey):**
```ts
test('admin views health dashboard, reloads data, and reloads the page', async ({ page }) => {
  await navbar.navigateToHealth();
  await health.expectLoaded();
  await health.expectAllOperational();
  await health.expectVersionsVisible();
  await health.reload();
  await health.expectLoaded();
  await page.reload();
  await page.waitForURL('**/health**');
  await health.expectLoaded();
});
```

#### E2E artifacts required per feature

1. **Page Object** in `e2e/pages/<feature>/` — encapsulates selectors (`data-testid`) and user actions.
2. **Spec file** in `e2e/tests/<feature>/<verb>-<noun>.spec.ts` — describes the happy-path user journey.
3. **`data-testid` attributes** on key interactive and structural elements in the frontend (see `breadly-frontend/AGENTS.md` section 23).
4. **Test data cleanup** — use the `[E2E-<test-name>]` prefix pattern and clean up created data in `afterAll`/`afterEach`.

E2E tests (`npm test` in `e2e/`) run against deployed preview environments in CI. They are not run locally as part of the development pipeline unless the developer has a local environment running.

### Phase 5: Code Review

13. After all verification passes, invoke the `code-reviewer` sub-agent via the Task tool to review all changes made in phases 1-4. Pass it a description of what was changed and which files were affected.
14. **Before the code-reviewer marks its review complete**, it must run `npm test` in every affected project and `npm test` in `e2e/` (if Phase 4 was not skipped), and confirm all tests pass. If tests fail, it must fix them and re-run before finishing.
15. If the code-reviewer applied fixes, re-run Phase 3 verification (lint, build, test) on the affected projects to ensure the fixes did not introduce regressions.

### Smart Skipping Rules

- **Pure frontend changes:** skip backend lint/build/test
- **Pure backend changes:** skip frontend lint/build/test
- **No API changes:** skip Phase 1 entirely
- **Documentation-only changes:** skip all phases, no review needed
- **Test-only changes:** skip Phase 1, run only test-related verification
- **Lint/formatting fixes:** skip Phase 1, skip Phase 4 (E2E), skip Phase 5 (no review needed for formatting)
- **No user-facing behavior changes (e.g., backend internals, config changes):** skip Phase 4 (E2E)
- **New user-facing feature:** Phase 4 (E2E) is **mandatory** — at least one happy-path spec required

## Code Review

All substantial code changes are reviewed by the `code-reviewer` sub-agent after implementation and verification. The code-reviewer enforces the conventions defined in each project's `AGENTS.md` and focuses on readability, maintainability, component slicing, and testability.

**The code-reviewer must always run `npm test` in every affected project as the final step of its review and must not finish until all tests pass.** For changes that include E2E coverage (Phase 4 was not skipped), it must also run `npm test` in `e2e/`. This catches type drift in test fixtures and broken user journeys before the changes reach CI.
