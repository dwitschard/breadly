# Breadly Frontend Architecture

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following the architecture and conventions defined in this document.

This document is the single source of truth for architecture decisions, coding conventions, and patterns in the Breadly frontend.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Routing](#3-routing)
4. [Component Architecture](#4-component-architecture)
5. [State Management](#5-state-management)
6. [RxJS & Observable Handling](#6-rxjs--observable-handling)
7. [Forms](#7-forms)
8. [API Integration](#8-api-integration)
9. [Pagination, Filtering & Sorting](#9-pagination-filtering--sorting)
10. [Styling](#10-styling)
11. [Responsive Layout](#11-responsive-layout)
12. [Loading & UX](#12-loading--ux)
13. [Error Handling](#13-error-handling)
14. [Dialogs & Modals](#14-dialogs--modals)
15. [Configuration](#15-configuration)
16. [Internationalization](#16-internationalization)
17. [Testing](#17-testing)
18. [Accessibility](#18-accessibility)
19. [Module Boundaries](#19-module-boundaries)
20. [Code Quality](#20-code-quality)
21. [Guards](#21-guards)
22. [Generated Code Policy](#22-generated-code-policy)
23. [E2E Testing & data-testid Conventions](#23-e2e-testing--data-testid-conventions)

---

## 1. Project Overview

Breadly is an Angular 21 frontend application built with:

- **Signals-first state management** — no NgRx or external state libraries
- **Standalone components** — no NgModules
- **Tailwind CSS v4** — utility-first styling, no component library
- **Vitest** — unit testing framework
- **API-first design** — OpenAPI spec is the single source of truth
- **`ngx-translate`** — internationalization with German (`de`) as the language

### TypeScript

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when the type is uncertain

### Angular

- Always use standalone components — must NOT set `standalone: true` inside Angular decorators (it is the default in Angular v20+)
- Use signals for state management
- Use `inject()` function exclusively — no constructor injection
- Use host bindings inside the `host` object of the `@Component` or `@Directive` decorator — do NOT use `@HostBinding` or `@HostListener` decorators
- Use `NgOptimizedImage` for all static images (`NgOptimizedImage` does not work for inline base64 images)

---

## 2. Folder Structure

The folder structure is prescriptive. All new code must follow this layout.

```
src/
  index.html
  main.ts
  styles.css                              # Global Tailwind import
  assets/
    i18n/
      de.json                             # German translation file
  app/
    app.ts                                # Root component
    app.config.ts                         # Application providers and initializer
    app.routes.ts                         # Top-level route definitions

    core/
      config.service.ts                   # Runtime config (IDP, feature flags)
      config-error.component.ts           # Error display when config loading fails

    auth/
      auth.service.ts                     # OAuthService wrapper, session state
      auth.guard.ts                       # withAuth() CanActivateFn factory
      auth.config.ts                      # OIDC AuthConfig builder
      auth-error.interceptor.ts           # HTTP interceptor for 401/403
      callback.component.ts               # OIDC redirect callback
      login.component.ts                  # Login redirect trigger
      logout.component.ts                 # Logout confirmation

    shared/
      helpers/
        to-signal-fn.ts                   # Helper to wrap Observables into signals
      components/
        spinner.component.ts              # Shared loading spinner
        skeleton.component.ts             # Configurable ghost/skeleton elements
        error-banner.component.ts         # Shared inline error display
        form-field.component.ts           # Form field: label + input + validation errors
        dialog.component.ts               # Modal dialog using native <dialog>
      services/
        dialog.service.ts                 # Imperative dialog open/close
      directives/                         # Shared directives (created when needed)
      pipes/                              # Shared pipes (created when needed)
      layout/
        layout.component.ts               # Shell: navbar + constrained content area
        navbar/
          nav.config.ts                   # Navigation link definitions
          navbar.container.ts             # Smart: injects auth/profile services
          navbar.component.ts             # Dumb: renders navigation links
          profile-menu.component.ts       # Dumb: avatar dropdown menu
      guards/
        unsaved-changes.guard.ts          # canDeactivate guard for dirty forms

    features/
      <feature>/
        <feature>.routes.ts               # Sub-router definition
        <feature>.router.component.ts     # loadChildren target, contains <router-outlet>
        <feature>.service.ts              # Feature-scoped service (wraps generated API service)
        <feature>.types.ts                # Feature-specific types and interfaces
        containers/
          <name>.container.ts             # Smart: data fetching, state management
        pages/
          <name>.page.ts                  # Smart: reads URL state, translates to model
        components/
          <name>.component.ts             # Dumb: input()/output() only

    generated/
      api/                                # Auto-generated Angular API client — NEVER edit
```

---

## 3. Routing

### Top-Level Routes

`app.routes.ts` uses `loadChildren` to lazy-load each feature's sub-router. Auth guards are applied at the parent route level.

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'recipes',
    canActivate: [withAuth()],
    loadChildren: () =>
      import('./features/recipes/recipes.routes').then((m) => m.RECIPES_ROUTES),
  },
  // ...
];
```

### Feature Sub-Routers

Each feature defines its own routes in `<feature>.routes.ts`. The sub-router defines additional paths and fine-grained access control if needed.

```typescript
// features/recipes/recipes.routes.ts
export const RECIPES_ROUTES: Routes = [
  { path: '', component: RecipesListContainerComponent },
  { path: 'new', component: RecipeCreatePageComponent },
  { path: ':id', component: RecipeDetailPageComponent },
];
```

### Conventions

- **Plural nouns** for route paths: `/recipes`, `/profiles`, `/settings`
- **Auth guard at parent level** to control feature-level access for user groups
- **Sub-router for fine-grained access** within a feature when needed
- **`PreloadAllModules`** preloading strategy
- The `*.router.component.ts` is the `loadChildren` target and contains the `<router-outlet>` for sub-routes

---

## 4. Component Architecture

Every feature enforces a strict smart/dumb component split. There are no exceptions.

### Component Types

| Type | Suffix | Location | Responsibility |
|------|--------|----------|----------------|
| **Router Component** | `.router.component.ts` | Feature root | `loadChildren` target, contains `<router-outlet>` |
| **Container** | `.container.ts` | `containers/` | Smart: injects services, fetches data, manages state, delegates rendering |
| **Page** | `.page.ts` | `pages/` | Smart: same as container, but also reads URL state (route params, query params) and translates to a model |
| **Component** | `.component.ts` | `components/` | Dumb: receives data via `input()`, emits events via `output()`, no injected services |

### Data Flow

```
Router
  -> router.component (<router-outlet>)
    -> page / container (smart: data fetching, state, URL translation)
      -> component (dumb: rendering, user interaction)
```

### Rules

- **Dumb components** must not inject services. They receive all data through `input()` signals and communicate back through `output()` events.
- **Smart components** (containers and pages) inject services, manage state via signals, and pass data down to dumb components.
- **Pages** are containers that additionally read URL state. They live in the `pages/` directory as a structural distinction.
- Use `input()` and `output()` functions — not `@Input()` and `@Output()` decorators.
- Use `computed()` for derived state.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in every `@Component` decorator.
- **Inline templates** for components under 50 lines. Use external `.html` templates above 50 lines.
- When using external templates/styles, use paths relative to the component TS file.
- Do NOT use `ngClass` — use `class` bindings instead.
- Do NOT use `ngStyle` — use `style` bindings instead.

### Selector Prefixes

Use feature-specific selector prefixes:

| Feature | Prefix |
|---------|--------|
| Recipes | `recipe-` |
| Profile | `profile-` |
| Health | `health-` |
| Shared | `app-` |
| Auth | `auth-` |
| Core | `core-` |

### File Naming

Use dot-separated names:

```
<name>.<type>.ts

Types: component, container, page, service, routes, types, router.component, spec
```

Examples: `recipe-card.component.ts`, `recipes-list.container.ts`, `recipe-detail.page.ts`, `recipes.service.ts`

---

## 5. State Management

### Approach

Signals and services only. No NgRx, no external state management libraries.

### Scoping Rules

| State Type | Location | Example |
|------------|----------|---------|
| **Feature-scoped** | Feature service (`<feature>.service.ts`) | Recipe list, recipe form state |
| **Cross-cutting** | `providedIn: 'root'` service in `shared/`, `auth/`, or `core/` | Auth state, user profile, notifications |
| **Component-local** | Component-level `signal()` | UI toggles, form dirty state |

### Signal Pattern

Services must use the private writable / public readonly pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly _recipes = signal<Recipe[]>([]);
  private readonly _loading = signal(false);

  readonly recipes = this._recipes.asReadonly();
  readonly loading = this._loading.asReadonly();
}
```

### Rules

- Use `signal()` for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals — use `update` or `set` instead
- Writable signals are private to the owning service; consumers only see readonly signals

---

## 6. RxJS & Observable Handling

### Signals-Only Application

The application is signals-first. Observables from external sources (generated API services, `OAuthService`, `ActivatedRoute`) must be converted to signals at the boundary.

### Shared Helper

A shared helper in `shared/helpers/to-signal-fn.ts` wraps Observable-returning functions into signal-based equivalents. Use this helper to convert generated API service methods at the feature service boundary.

### Conversion Rules

| Source | Conversion | Location |
|--------|-----------|----------|
| Generated API service methods | Wrap via `rxResource()` or the shared helper | Feature service |
| `ActivatedRoute.params` / `queryParamMap` | `toSignal()` | Page components |
| Router events | `toSignal()` | Containers or pages |
| Long-lived Observable streams | `toSignal()` with `takeUntilDestroyed()` | Services |

### Rules

- **Only signals** are passed between components. No Observable inputs or outputs.
- **Never subscribe** to Observables directly in containers, pages, or components.
- **Feature services** are the only place where Observable-to-signal conversion happens.
- The **`async` pipe** is a last resort — allowed only in containers, never in dumb components. Prefer converting to a signal instead.
- **No orphan subscriptions** — every subscription must be managed via `takeUntilDestroyed()` or complete naturally (e.g., HTTP calls that auto-complete).

```typescript
// Feature service: wrapping API calls with rxResource()
@Injectable({ providedIn: 'root' })
export class RecipeFeatureService {
  private readonly api = inject(RecipesService);

  readonly recipesResource = rxResource({
    loader: () => this.api.getRecipes(),
  });

  // Consumers use:
  // recipesResource.value()      -> Recipe[] | undefined
  // recipesResource.isLoading()  -> boolean
  // recipesResource.error()      -> unknown
}
```

```typescript
// Page component: converting route params to signals
export class RecipeDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly recipeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id')!))
  );
}
```

---

## 7. Forms

### Signal-Based Forms Only

Use Angular's signal-based forms exclusively. Traditional `ReactiveFormsModule` (`FormGroup`, `FormControl`) and template-driven forms are not allowed.

### Shared Form Field Component

Use the shared `FormFieldComponent` from `shared/components/form-field.component.ts` for all form fields. This component encapsulates:

- Label rendering
- Input element
- Validation error display
- Accessibility attributes (`aria-describedby`, `aria-invalid`)

This ensures consistent form UX and accessibility across all features.

---

## 8. API Integration

### API-First Workflow

The `openapi.yaml` in `@breadly-api/` is the single source of truth for all API endpoints.

**To add or modify an API endpoint:**

1. Update `openapi.yaml` in `breadly-api/`
2. Validate with `npm run lint` in `breadly-api/`
3. Regenerate the Angular client with `npm run generate-api` in `breadly-frontend/`
4. Implement the frontend feature using the generated services

No frontend work on a new endpoint begins until the OpenAPI spec is updated and validated.

### REST Principles

API design must follow REST principles:

- Plural resource names (`/recipes`, not `/recipe`)
- Standard HTTP methods: `GET` (list/read), `POST` (create), `PUT` (replace), `PATCH` (partial update), `DELETE` (remove)
- Consistent error response shape using the `ErrorResponse` schema
- Proper HTTP status codes (`200`, `201`, `204`, `400`, `404`, `500`)

### Generated Angular Client

The Angular API client is generated using `@openapitools/openapi-generator-cli` with the `typescript-angular` generator. Generated code lives in `src/app/generated/api/`.

### Feature Service Wrapping

Feature services must wrap the generated API services. Never inject generated services directly into containers or pages. Use `rxResource()` and `resource()` as the standard data-fetching pattern.

```typescript
// features/recipes/recipes.service.ts
@Injectable({ providedIn: 'root' })
export class RecipeFeatureService {
  private readonly api = inject(RecipesService); // Generated service

  // Declarative data fetching with rxResource
  readonly recipesResource = rxResource({
    loader: () => this.api.getRecipes(),
  });

  // Consumers use:
  // recipesResource.value()      -> Recipe[] | undefined
  // recipesResource.isLoading()  -> boolean
  // recipesResource.error()      -> unknown

  // Mutations still use the shared Observable-to-signal helper or direct subscription
  createRecipe(dto: CreateRecipeDto): void {
    this.api.createRecipe(dto).subscribe({
      next: () => this.recipesResource.reload(),
    });
  }
}
```

### Rules

- Never write manual `HttpClient` calls for API endpoints
- Always use the generated services through feature service wrappers
- DTOs come from the generated models — do not redefine them
- Use `rxResource()` and `resource()` for all data fetching — do not manually subscribe and set signals
- After mutations (create, update, delete), call `resource.reload()` to refresh the data

---

## 9. Pagination, Filtering & Sorting

### URL-Driven List State

For list features, pagination, filtering, and sorting state is stored in URL query parameters. This makes list state bookmarkable and shareable.

### Pattern

Pages read query parameters via `ActivatedRoute` and translate them into a model. The feature service uses `rxResource()` with reactive request parameters that automatically reload when the URL changes.

```typescript
// pages/recipes-list.page.ts
export class RecipesListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly recipeService = inject(RecipeFeatureService);

  private readonly queryParams = toSignal(this.route.queryParamMap);

  readonly page = computed(() => Number(this.queryParams()?.get('page') ?? 1));
  readonly sortBy = computed(() => this.queryParams()?.get('sort') ?? 'name');
}
```

```typescript
// features/recipes/recipes.service.ts
@Injectable({ providedIn: 'root' })
export class RecipeFeatureService {
  private readonly api = inject(RecipesService);

  readonly page = signal(1);
  readonly sortBy = signal('name');

  readonly recipesResource = rxResource({
    request: () => ({ page: this.page(), sort: this.sortBy() }),
    loader: ({ request }) => this.api.getRecipes(request.page, request.sort),
  });
}
```

### Rules

- Pagination parameters (`page`, `pageSize`), filters, and sort order are stored as query params
- Pages translate query params to signals and pass them to the feature service
- `rxResource()` with `request` parameter triggers automatic reload when parameters change
- The API must support pagination, filtering, and sorting — define these in `openapi.yaml` first

---

## 10. Styling

### Tailwind CSS v4

The project uses Tailwind CSS v4 with PostCSS. No other CSS framework or component library is used.

### Rules

- **Tailwind utilities only** — no custom CSS files per component
- **Extract repeated patterns** with `@apply` when a utility combination is used 3+ times across the codebase
- **No arbitrary values** — use Tailwind's design tokens exclusively (e.g., `p-4` not `p-[13px]`)
- **No dark mode** — not in scope
- **Tailwind animations and transitions** — use Tailwind's `transition-*`, `duration-*`, `animate-*` utilities. Do not use `@angular/animations`

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables only in containers when signal conversion is not possible
- Do not assume globals like `new Date()` are available in templates
- **`@for` track expression** — always track by a unique identifier, never by `$index`

```html
<!-- Correct: track by unique ID -->
@for (recipe of recipes(); track recipe._id) {
  <recipe-card [recipe]="recipe" />
}

<!-- Incorrect: track by index -->
@for (recipe of recipes(); track $index) {
  <recipe-card [recipe]="recipe" />
}
```

Only use `$index` when items have no unique identifier (e.g., a list of primitive values without IDs).

---

## 11. Responsive Layout

### Breakpoints

Use Tailwind's default breakpoints only:

| Breakpoint | Min-width |
|------------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Design Approach

- **Mobile-first** — base styles target mobile, layer up with `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Max-width constraint** — main content area is capped at `max-w-screen-2xl` (1536px) and centered with `mx-auto`. Content must NOT span the full window width on large screens.

### Layout Shell

A shared `LayoutComponent` in `shared/layout/` provides the structural shell:

- Navbar (full-width)
- Content area (max-width constrained, centered, responsive padding)

All feature routes render within this layout shell. The layout is the single place for structural responsive adjustments (padding, max-width, content centering).

---

## 12. Loading & UX

### Loading Spinner

Use the shared `SpinnerComponent` from `shared/components/spinner.component.ts` for all loading states. All features must show a loading indicator during async operations.

### Skeleton / Ghost Elements

Use the shared configurable `SkeletonComponent` from `shared/components/skeleton.component.ts` for ghost loading states where it makes sense (e.g., lists, cards, profile sections). The skeleton component should be configurable for different shapes and sizes (lines, circles, rectangles).

### Cumulative Layout Shift

Follow the pattern that best matches the UI being built. General guidelines:

- Use `NgOptimizedImage` with explicit `width`/`height` for images
- Use skeleton placeholders that approximate the dimensions of real content

---

## 13. Error Handling

### Application-Level (HTTP Interceptor)

A functional `HttpInterceptorFn` in `auth/auth-error.interceptor.ts` handles cross-cutting HTTP errors:

| Status | Behavior |
|--------|----------|
| **401 Unauthorized** | Clear session, redirect to login |
| **403 Forbidden** | Display a forbidden/access-denied message |

### Feature-Level (Containers)

Containers (smart components) are responsible for catching domain-specific errors (400 validation, 404 not found) from feature services and displaying appropriate user messages using the shared `ErrorBannerComponent`.

### Shared Error Component

Use `ErrorBannerComponent` from `shared/components/error-banner.component.ts` for inline error display. This component receives an error message and renders it consistently.

---

## 14. Dialogs & Modals

### Native `<dialog>` Element

Use the native HTML `<dialog>` element for all modal dialogs. Do not use Angular CDK, Angular Material, or third-party modal libraries.

The `<dialog>` element provides built-in:
- Backdrop rendering
- Focus trapping
- Escape key to close
- Accessibility (`role="dialog"`, `aria-modal="true"`)

### Shared Components

#### `DialogComponent` (Dumb)

Located at `shared/components/dialog.component.ts`. A reusable presentational component:

- Accepts `title` via `input()`
- Emits `confirm` and `cancel` via `output()`
- Uses `<ng-content>` for dialog body
- Wraps the native `<dialog>` element with consistent styling

#### `DialogService`

Located at `shared/services/dialog.service.ts`. Provides imperative dialog control:

- `open()` — programmatically show a dialog (e.g., confirmation prompts from guards)
- `close()` — programmatically close the dialog
- Returns a signal or Promise with the user's response

### Usage

```html
<!-- Declarative usage in a template -->
<app-dialog [title]="'Delete Recipe'" (confirm)="onDelete()" (cancel)="onCancel()">
  <p>Are you sure you want to delete this recipe?</p>
</app-dialog>
```

The unsaved-changes guard uses `DialogService` to show a confirmation dialog imperatively before allowing navigation.

---

## 15. Configuration

### Runtime Configuration Only

All application configuration is fetched at runtime via the `/api/public/config` endpoint. This allows per-stage configuration without rebuilding the application.

- The `APP_INITIALIZER` fetches `/api/public/config` before the app bootstraps
- `ConfigService` in `core/` stores the configuration
- If the config request fails, `ConfigErrorComponent` is displayed

Do not use build-time `environment.ts` files for configuration that varies per deployment stage. Use the runtime config endpoint instead.

---

## 16. Internationalization

### ngx-translate

Use `ngx-translate` for all static texts in the application. No hardcoded user-facing strings in templates or components.

### Configuration

- **Language:** German (`de`) is the only language
- **Loader:** `HttpLoader` — translations are fetched at runtime
- Use the `translate` pipe in templates

### Translation File

A single translation file at `src/assets/i18n/de.json`. Split into separate files when the file exceeds ~500 keys.

### File Format

Nested JSON organized by feature:

```json
{
  "COMMON": {
    "SAVE": "Speichern",
    "CANCEL": "Abbrechen",
    "DELETE": "Löschen",
    "LOADING": "Laden...",
    "ERROR": "Ein Fehler ist aufgetreten"
  },
  "RECIPES": {
    "TITLE": "Rezepte",
    "CREATE": "Neues Rezept erstellen",
    "DELETE_CONFIRM": "Möchten Sie dieses Rezept wirklich löschen?"
  },
  "PROFILE": {
    "TITLE": "Profil",
    "EDIT_BUTTON": "Profil bearbeiten"
  }
}
```

### Key Naming Convention

- All keys are `UPPER_SNAKE_CASE`
- Top-level keys match feature names (`RECIPES`, `PROFILE`, `HEALTH`)
- `COMMON` for shared strings used across features
- Keys are descriptive: `RECIPES.DELETE_CONFIRM`, not `RECIPES.MSG1`

---

## 17. Testing

### Framework

Vitest with `@angular/build:unit-test`. No Karma, no Jasmine.

### Testing Responsibilities

Every artifact type has a defined testing scope:

| Artifact | What to Test |
|----------|-------------|
| **Containers** | Data flow, service interactions, state transitions, error handling |
| **Pages** | URL-to-model translation, route param parsing |
| **Components** (dumb) | Input/output bindings, template rendering, user interaction |
| **Services** | API calls, caching, error handling, signal state changes |
| **Pure functions** | Input/output with simple unit tests |
| **Guards** | Route activation/deactivation logic |

### Testing Patterns

- **Dumb components** are tested in isolation: set inputs, assert rendered output, trigger events and assert emitted outputs
- **Containers** are tested by mocking injected services and asserting signal state changes
- **Pages** are tested by providing mock `ActivatedRoute` and asserting model translation
- **Services** are tested by mocking the generated API services and asserting state management

---

## 18. Accessibility

These requirements are non-negotiable.

- It MUST pass all AXE accessibility checks
- It MUST follow all WCAG AA minimums
- Proper **focus management** for modals, dialogs, and navigation
- **Color contrast** ratios must meet WCAG AA standards
- **ARIA attributes** must be used where semantic HTML is insufficient
- All form fields must have associated labels
- Interactive elements must be keyboard-accessible

---

## 19. Module Boundaries

### Import Rules

Strict module boundaries are enforced to prevent coupling between features.

**Features may import from:**
- `shared/`
- `auth/`
- `core/`
- `generated/`

**Features must NEVER import from:**
- Other features — cross-feature communication goes through shared services or the router (query params, route data)

```
features/recipes/  -->  shared/       (allowed)
features/recipes/  -->  auth/         (allowed)
features/recipes/  -->  core/         (allowed)
features/recipes/  -->  generated/    (allowed)
features/recipes/  -->  features/profile/  (FORBIDDEN)
```

### No Barrel Exports

Do not use `index.ts` barrel files. Always import directly from the specific file path.

```typescript
// Correct: direct import
import { RecipeCardComponent } from './components/recipe-card.component';

// Incorrect: barrel import
import { RecipeCardComponent } from './components';
```

Barrel files cause circular dependency risks and make imports harder to trace. Angular's lazy loading works best with direct file imports.

---

## 20. Code Quality

### Dependency Injection

Use the `inject()` function exclusively. No constructor injection.

```typescript
// Correct
private readonly service = inject(MyService);

// Incorrect
constructor(private service: MyService) {}
```

### Code Comments

No comments on code. Code must be self-explanatory through clear naming and small, focused functions.

### Architecture Decision Records

Create ADRs for significant architectural changes. ADRs document the context, decision, and consequences of important technical decisions.

### Commit Conventions

Use conventional commits:

```
feat: add recipe detail page
fix: resolve auth redirect loop
chore: update dependencies
docs: update architecture document
refactor: extract shared skeleton component
test: add recipe service tests
```

### Pre-Commit Checks

The following checks must pass before committing:

1. **Prettier** — formatting
2. **Linting** — code quality
3. **Tests** — all unit tests pass

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## 21. Guards

### Functional Guards

All guards are functional `CanActivateFn` factories, not class-based guards.

```typescript
// auth/auth.guard.ts
export function withAuth(): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if (authService.isLoggedIn()) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };
}
```

### Guard Types

| Guard | Location | Purpose |
|-------|----------|---------|
| **Auth guard** (`withAuth()`) | `auth/auth.guard.ts` | Checks authentication, redirects to login |
| **Role-based guards** | Feature-level or `auth/` | Fine-grained access control per user group (implement when needed) |
| **Unsaved changes guard** | `shared/guards/unsaved-changes.guard.ts` | `canDeactivate` guard, checks `HasUnsavedChanges` interface |

### Unsaved Changes Pattern

Components with forms implement the `HasUnsavedChanges` interface:

```typescript
interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}
```

The shared `canDeactivate` guard checks this interface and prompts the user before navigating away from dirty forms.

---

## 22. Generated Code Policy

The generated API client in `src/app/generated/api/` is auto-generated and gitignored.

### Rules

- **Never manually edit** files in `src/app/generated/`
- **Always regenerate** after pulling changes: `npm run generate-api`
- Generated code must exist before running `build`, `test`, or `lint` — run `npm run generate-api` first
- `npm start` chains `generate-api` automatically for convenience; other scripts assume it has already been run
- In CI, a dedicated workflow step handles generation before lint/test/build
- If generated code does not fit the use case, the fix goes into `openapi.yaml` — not the generated output
- Generated DTOs and services are the canonical API types — do not redefine them in feature code

---

## 23. E2E Testing & data-testid Conventions

### Overview

End-to-end tests live in the `e2e/` project at the monorepo root, independent of the frontend. E2E tests validate user journeys against deployed preview environments using Playwright. The frontend's responsibility is to provide stable `data-testid` attributes for E2E selectors.

### `data-testid` Attribute Convention

Place `data-testid` attributes on interactive elements and key structural elements that E2E Page Objects need to locate. Not every element needs one — only those where CSS-cascade selectors would be brittle.

#### Naming Format

`<feature>-<element>` using kebab-case:

```
recipe-list              # The recipe list container
recipe-list-item         # Individual recipe in the list
recipe-name-input        # The recipe name input field
recipe-add-btn           # The add recipe button
recipe-delete-btn        # A delete button on a recipe
nav-recipes-link         # Navbar link to recipes
nav-health-link          # Navbar link to health
profile-email            # Email display on profile page
profile-title            # Profile page title
```

#### Prefixes by Feature

| Feature | Prefix |
|---------|--------|
| Recipes | `recipe-` |
| Profile | `profile-` |
| Health | `health-` |
| Navigation | `nav-` |
| Auth | `auth-` |
| Home | `home-` |

#### Rules

- `data-testid` values are static strings — no dynamic values based on data
- Do NOT add `data-testid` to every element; only where E2E tests need stable selectors
- `data-testid` attributes are kept in production builds (no stripping)
- When adding a new feature, add `data-testid` attributes to key interactive and structural elements as part of the implementation

### Adding E2E Tests for New Features

When a new user-facing feature is implemented, the following E2E artifacts must be created in `e2e/`:

1. **Page Object** (`e2e/pages/<feature>/<name>.page.ts`): Encapsulates all selectors and user actions for the feature. References `data-testid` attributes. Exposes methods named after user actions (e.g., `createRecipe()`, `expectRecipeVisible()`).

2. **Spec file** (`e2e/tests/<feature>/<verb>-<noun>.spec.ts`): Describes the user journey. Uses Page Object methods exclusively — never references selectors directly. Each spec file covers one complete user journey.

3. **Test data**: Use `[E2E-<test-name>]` prefix pattern for created data. Clean up in `afterAll`/`afterEach` via API calls.

### Page Object Pattern

Page Objects are organized by feature, mirroring the frontend structure:

```
e2e/pages/
  recipes/
    recipe-list.page.ts
    recipe-detail.page.ts
    recipe-form.page.ts
  profile/
    profile.page.ts
  auth/
    login.page.ts
  shared/
    navbar.page.ts
```

Rules:
- One Page Object per page/route
- All selectors use `data-testid` attributes via `page.getByTestId()`
- Methods are named after user actions, not DOM operations
- Spec files never reference selectors — only Page Object methods

### Fixtures

E2E tests use custom Playwright fixtures:
- **`auth.fixture.ts`**: Validates that storageState exists (authentication is set up)
- **`api.fixture.ts`**: Extends auth fixture with API helper methods for test data creation/cleanup

### Spec File Naming

Spec files use `<verb>-<noun>.spec.ts` format describing the user journey:

```
manage-recipe.spec.ts    # CRUD operations on recipes
browse-pages.spec.ts     # Navigation between pages
view-profile.spec.ts     # Viewing profile information
sign-in-out.spec.ts      # Authentication flow
```

### E2E Testing Responsibilities

| Artifact | E2E Coverage |
|----------|-------------|
| **New feature** | At least one user journey spec |
| **New page/route** | Page Object + spec covering navigation and key content |
| **New interactive element** | `data-testid` attribute on the element |
| **API changes** | Update test data helpers if affected |
