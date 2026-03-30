# Breadly Backend Architecture

Express + TypeScript backend. Feature-based folder structure with OpenAPI-generated DTOs.

## Project Structure

```
src/
  app.ts                    # Express app setup, route registration, middleware wiring
  server.ts                 # Entry point: DB init + app.listen()
  app/generated/api/        # Auto-generated OpenAPI types — NEVER edit manually
  auth/                     # Auth configuration (roles)
  config/                   # Centralized environment config (planned)
  common/                   # Shared utilities (logger, helpers)
  database/                 # DB connection and collection registry
  domain/                   # Shared domain types (errors)
  features/                 # Feature modules
  middleware/                # Cross-cutting Express middleware
```

## Feature File Structure

Every feature lives in `src/features/<name>/`. Use `recipe/` as the reference implementation.

### Data-backed features (with persistence)

```
src/features/<name>/
  <name>.controller.ts       # Express Router — HTTP handling only
  <name>.service.ts           # Business logic + data access
  <name>.model.ts             # Persistence model interface (stored shape, without id)
  <name>.controller.http      # REST Client manual test file (required)
  <name>.controller.spec.ts   # Integration tests (supertest)
  <name>.service.spec.ts      # Unit tests (mocked dependencies)
```

### Controller-only features (no persistence)

```
src/features/<name>/
  <name>.controller.ts
  <name>.controller.http
  <name>.controller.spec.ts
```

Naming convention: always `<feature>.<layer>.ts` — no exceptions.

## Layering Rules

- **Controller**: creates an Express `Router()`, handles request/response, delegates to service. Never accesses the data layer directly.
- **Service**: contains business logic and data access. Exports plain async functions (not a class). Contains a `toX()` mapping function that converts the stored document to the API response type.
- **Model**: defines the persisted data shape as a TypeScript interface (without id).

## API-First Workflow

The OpenAPI spec in the sibling `breadly-api/` project is the **single source of truth** for all API types.

Workflow for API changes:
1. Edit the OpenAPI spec in `breadly-api/openapi.yaml`
2. Run `npm run generate-api` in `breadly-backend/` to regenerate TypeScript DTOs
3. Run `npm run build` to verify compilation
4. Update feature code to use the new/changed generated types
5. Run `npm test` to verify all tests pass

**NEVER manually edit files under `src/app/generated/`.** To change API types, update the OpenAPI spec and regenerate.

## Type Conventions

- Use generated DTOs from `../../app/generated/api/index.js` for request/response types (`CreateXDto`, `UpdateXDto`, `PatchXDto`, `X`).
- Type controller route handlers with `Request<Params, unknown, BodyDto>`.
- Do NOT create hand-written API types — use the generated ones.

## Error Handling

- Use the generated `ErrorResponse` shape for all error responses: `{ message: string; statusCode?: number }`.
- Throw `ApplicationError` (from `src/domain/error.types.ts`) for business errors — pass the HTTP status code.
- The global error handler middleware catches these automatically.
- Follow standard REST status codes (200 success, 201 created, 204 no content, 404 not found, etc.).

## Input Validation

Controllers must validate request input at runtime. TypeScript types are compile-time only and do not protect against malformed requests.

## Authentication

- Protected routes use `requireAuth()` middleware, registered in `app.ts`.
- Public routes are registered without `requireAuth()`.
- Role-based access is available via `requireAuth([Role.ADMIN])` — see `src/auth/roles.config.ts` for available roles.

## Route Registration in app.ts

Order matters. When adding a new controller to `app.ts`:
1. Public routes (no auth) — registered before protected routes
2. Protected routes — wrapped with `requireAuth()`
3. Global error handler — always last (`app.use(globalErrorHandler)`)

## Environment Configuration

All environment variables must be accessed through a centralized config module (`src/config/env.ts`). Do NOT access `process.env` directly in feature code.

## Logging

Use `pino` for structured logging with `pino-http` middleware for automatic request logging. Create a shared logger instance in `src/common/logger.ts`. Never use `console.log`.

## API Patterns

- List endpoints must support pagination via query parameters.
- List endpoints should support filtering and sorting via query parameters where appropriate.

## TypeScript

- Strict mode is enabled — do not disable it.
- Avoid `any` — use `unknown` when the type is uncertain.
- Use `.js` extensions in all imports (ESM).
- Use relative paths within features, `../../` for cross-cutting concerns.

## Linting & Formatting

- ESLint is configured with TypeScript and Jest plugins. Generated code under `src/app/generated/` is excluded.
- Use Prettier for consistent code formatting.
- Both `npm test` and `npm run lint` must pass before a feature is considered complete.

## Testing

### Unit Tests

- File naming: `<name>.<layer>.spec.ts` (e.g. `recipe.service.spec.ts`)
- Co-located next to the file under test
- Mock external dependencies (data layer, other services)

### Integration Tests

- File naming: `<name>.controller.spec.ts`
- Co-located next to the controller
- Use `supertest` against the Express `app`
- Auth in tests: build a fake JWT with `makeToken()` helper, pass as `Authorization: Bearer <token>` header

## Definition of Done

A feature is NOT complete until ALL of the following are satisfied:
1. Unit tests exist for the service layer
2. Integration tests exist for the controller layer
3. `.controller.http` file exists with example requests for each endpoint
4. Generated DTOs are used (no hand-written API types)
5. Controller is registered in `app.ts`
6. `npm test` passes
7. `npm run lint` passes
