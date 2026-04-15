# PRD: Migrate Frontend Tests to Angular Testing Library

## Problem Statement

The Breadly frontend has 14 unit/integration test files. The 10 component test files use raw `TestBed`/`ComponentFixture`/`querySelector` patterns that test implementation details rather than user-visible behavior. This leads to:

- **Fragile tests** that break on refactors even when user-facing behavior is unchanged. Tests query by CSS class names (`.text-gray-600`), DOM structure (`querySelectorAll('li')`), and element tag names rather than accessible roles or visible text.
- **Boilerplate explosion** from duplicate `FakeLoader` classes for `ngx-translate`. Nine separate test files each define their own `FakeLoader` with hardcoded German translations, meaning every translation key change requires updating multiple test files.
- **Testing internals** instead of behavior. Tests access `fixture.componentInstance` properties, call private methods via `asAny()` casts, spy on `output().emit` directly, and wrap components in `TestHostComponent` harnesses — all patterns that couple tests to implementation rather than user experience.
- **Smoke tests that verify nothing**. Every test file includes `expect(component).toBeTruthy()` as its first test, which only confirms the component was instantiated but provides no behavioral coverage.
- **Container tests coupled to HTTP layer**. Container test files use `HttpTestingController` to flush mock HTTP responses, making them slow, verbose, and testing the wrong boundary. Container tests should mock at the service layer (the architectural boundary) not the network layer.
- **No standard test utilities**. Each test file independently configures `TestBed` with translations, providers, and boilerplate. There is no shared test setup.

These patterns make tests expensive to write, expensive to maintain, and provide a false sense of coverage — they test how the code works, not what the user sees.

## Solution

Migrate all 10 component test files to Angular Testing Library (ATL) in a single big-bang migration. ATL enforces the Testing Library guiding principle: "The more your tests resemble the way your software is used, the more confidence they can give you."

The migration introduces:

1. **A shared `renderWithProviders()` utility** that pre-configures `TranslateModule.forRoot()` (passthrough mode — translation keys render as-is) and accepts all ATL `RenderComponentOptions` as passthrough. This eliminates all 9 `FakeLoader` classes.
2. **`@testing-library/jest-dom`** matchers wired globally via `setupFiles` in `angular.json`, providing semantic assertions like `toBeInTheDocument()`, `toHaveAccessibleName()`, `toBeDisabled()`.
3. **`@testing-library/user-event`** for realistic user interactions (typing, clicking, tabbing) instead of programmatic DOM manipulation.
4. **Semantic query priority** (`getByRole` > `getByLabelText` > `getByText` > `getByTestId`) that naturally enforces accessibility — if a component can't be found by its role, it has an accessibility problem.
5. **A canonical test file structure** enforced across all migrated tests: no `beforeEach`, explicit `setup()` functions, fewer longer tests, mock data constants and setup at the bottom of `describe`.
6. **Updated AGENTS.md section 17** documenting all new conventions so future development follows ATL patterns.

The 4 non-component test files (2 service tests, 2 pure function tests) remain unchanged — ATL is not applicable to them.

## User Stories

1. As a developer, I want component tests to query elements by accessible role and visible text, so that tests naturally enforce accessibility and don't break when CSS classes or DOM structure change.

2. As a developer, I want a single shared `renderWithProviders()` utility, so that I don't have to manually configure `TranslateModule`, `FakeLoader`, and boilerplate providers in every test file.

3. As a developer, I want translation keys to render as-is in tests (passthrough mode), so that tests assert against stable key strings like `'RECIPES.EMPTY'` instead of German text that changes when copy is updated.

4. As a developer, I want to use `@testing-library/user-event` for simulating clicks, typing, and keyboard navigation, so that test interactions match real user behavior including focus management and event sequencing.

5. As a developer, I want `@testing-library/jest-dom` matchers available globally, so that I can write readable assertions like `expect(button).toBeDisabled()` instead of `expect(button.disabled).toBe(true)`.

6. As a developer, I want dumb component tests to use ATL's `on` render option with `vi.fn()` for output testing, so that I never access `fixture.componentInstance` or spy on `output().emit`.

7. As a developer, I want container tests to mock at the feature service boundary with controllable signals, so that tests are fast, focused on data flow, and don't require `HttpTestingController` or network-level mocking.

8. As a developer, I want container tests to render real child components, so that the full component tree is validated without stubbing out children.

9. As a developer, I want every component test to follow a canonical structure (imports, describe, user setup, tests, mock data, setup function), so that tests are predictable and easy to navigate across the codebase.

10. As a developer, I want no `beforeEach` blocks in component tests, so that each test is self-contained and I can read any test in isolation without understanding shared setup state.

11. As a developer, I want all `TestHostComponent` wrappers eliminated, so that dumb components are tested directly through ATL's `render()` with `componentInputs` and `on` options.

12. As a developer, I want all `asAny()` casts and private method access eliminated from tests, so that tests only exercise the component's public contract (what the user sees and interacts with).

13. As a developer, I want all `expect(component).toBeTruthy()` smoke tests removed, so that every test assertion verifies meaningful behavior.

14. As a developer, I want the AGENTS.md section 17 (Testing) to document ATL conventions, forbidden patterns, the testing boundary table, and examples, so that all future component tests follow the new standard.

15. As a developer, I want the migration done as a single big-bang change, so that the codebase has one consistent testing approach and I never have to context-switch between old and new patterns.

16. As a developer, I want service and pure function tests to remain untouched, so that only the tests that benefit from ATL are migrated and we don't introduce unnecessary churn.

17. As a developer, I want tests to fail if a component lacks proper ARIA roles or labels, so that accessibility regressions are caught at the unit test level through query failures rather than requiring a separate audit.

18. As a developer, I want `setup()` functions at the bottom of each `describe` block that return handlers and query results, so that tests can destructure exactly what they need and test setup is explicit.

19. As a developer, I want profile-menu tests to use real click interactions (click avatar button to open, click menu items, click outside to close), so that the dropdown behavior is tested as a user would experience it rather than by calling `toggle()` programmatically.

20. As a developer, I want health container tests to mock `HealthFeatureService` with controllable signals that replicate the `rxResource` API shape (`.value()`, `.isLoading()`, `.error()`, `.reload()`), so that I can test loading, error, and success states without any HTTP mocking.

## Implementation Decisions

### Dependency Additions

Four new `devDependencies` are added to the frontend `package.json`:
- `@testing-library/angular` — core ATL render/query functions for Angular
- `@testing-library/dom` — peer dependency providing DOM queries
- `@testing-library/user-event` — realistic user interaction simulation
- `@testing-library/jest-dom` — semantic DOM matchers for Vitest

### Test Infrastructure (2 new files + 2 config changes)

**Global test setup file**: A setup file that imports `@testing-library/jest-dom/vitest` to register custom matchers. This is wired via the `setupFiles` option in `angular.json`'s test builder configuration.

**Shared render utility**: A `renderWithProviders()` wrapper function that:
- Accepts a component type and all `RenderComponentOptions` as passthrough
- Pre-configures `TranslateModule.forRoot()` (no loader, no `use('de')` — the `DefaultMissingTranslationHandler` returns the key as-is)
- Merges caller-provided imports/providers with the shared defaults
- Re-exports `screen` and `userEvent` for convenience

**`angular.json`**: The `test` builder options gain a `setupFiles` array pointing to the global setup file.

**`tsconfig.spec.json`**: The `types` array gains `@testing-library/jest-dom` to provide TypeScript declarations for custom matchers.

### Translation Handling: Passthrough Mode

`TranslateModule.forRoot()` with no arguments uses `TranslateNoOpLoader` internally, which returns `of({})`. When a key is not found, `DefaultMissingTranslationHandler` returns `params.key`. This means `{{ 'RECIPES.EMPTY' | translate }}` renders the string `'RECIPES.EMPTY'` in the DOM. Tests assert against these stable keys, not German translations.

This eliminates all 9 `FakeLoader` classes and removes the dependency between test assertions and translation file content.

### Canonical Test File Structure

Every ATL component test follows this exact structure:

```
1. Imports
2. describe('<ComponentName>') {
3.   const user = userEvent.setup()
4.   it('...') { ... }     // Tests in the middle
5.   it('...') { ... }
6.   // Mock data constants (MOCK_PROFILE, MOCK_RECIPES, etc.)
7.   async function setup(...) { ... }  // Always last, always async
8. }
```

- **No `beforeEach`** — every test calls `setup()` explicitly with the parameters it needs
- **`setup()` returns** an object with everything the test needs (query results, event handlers, etc.)
- **Fewer, longer tests** following Tim Deschryver's recommendation — a single test can cover multiple assertions about one scenario rather than splitting every assertion into its own `it` block

### Dumb Component Testing Pattern

Dumb components are rendered directly with ATL's `render()` (via `renderWithProviders()`). Inputs are set via `componentInputs`. Outputs are captured via the `on` render option with `vi.fn()`. No `fixture.componentInstance` access. No `spyOn(component.output, 'emit')`. No `TestHostComponent`.

### Smart Component (Container/Page) Testing Pattern

Containers render their real child components. Mocking happens at the **service boundary**: the injected feature service is replaced with a fake that exposes controllable signals.

For services using `rxResource()`, the fake replicates the public API shape:
- `.value()` — `signal()` with test data
- `.isLoading()` — `signal(boolean)`
- `.error()` — `signal(unknown)`
- `.reload()` — `vi.fn()`

The fake service is provided via `componentProviders` in ATL's `render()` options.

### Query Priority

Queries follow the Testing Library recommended priority:
1. `getByRole` — buttons, headings, lists, links, alerts (primary choice)
2. `getByLabelText` — form fields
3. `getByText` — static text content (translation keys in passthrough mode)
4. `getByTestId` — escape hatch only, for elements that lack semantic roles

### User Interactions

`@testing-library/user-event` with `userEvent.setup()` is the standard. This provides realistic event sequencing (mousedown, focus, mouseup, click) and keyboard interaction support. `fireEvent` is a fallback only when user-event doesn't support a specific interaction.

### Files Migrated (10 test files)

1. Error banner component spec — dumb, simplest
2. Spinner component spec — dumb, simple
3. Recipe list component spec — dumb, list rendering + delete output
4. Recipe form component spec — dumb, form interaction + submit output
5. Health dashboard component spec — dumb, conditional rendering
6. Version info component spec — dumb, links vs plain text
7. Profile menu component spec — dumb, most complex (dropdown, outside click, multiple outputs)
8. Health container spec — smart, rxResource mocking
9. Profile container spec — smart, service signal mocking
10. App spec — root component, conditional rendering based on config state

### Files Unchanged (4 test files)

1. Auth config spec — pure function test
2. Auth service spec — service test (TestBed + HttpTestingController is correct here)
3. Profile service spec — service test
4. Profile display name spec — pure function test

### Forbidden Patterns (Eliminated)

All migrated tests must not contain any of these patterns:
- `fixture.componentInstance` access
- `querySelector` / `querySelectorAll`
- `spyOn(component.output, 'emit')`
- `TestHostComponent` wrappers
- `asAny()` / private method access (e.g., calling `toggle()`, `onProfileClick()`, `onDocumentClick()`)
- `beforeEach` for component rendering
- `expect(component).toBeTruthy()` smoke tests
- `FakeLoader` classes for `ngx-translate`
- `HttpTestingController` in container tests
- German text assertions (must use translation keys)

### Documentation Update

AGENTS.md section 17 (Testing) is fully rewritten to document:
- ATL as the standard for all component tests
- The canonical test file structure
- The `renderWithProviders()` utility and translation passthrough
- Query priority rules
- Dumb component testing pattern with `on` for outputs
- Smart component testing pattern with service boundary mocking
- Forbidden patterns list
- The testing boundary table (which artifact type uses which testing approach)
- The unchanged scope for services, pure functions, guards, and interceptors

## Testing Decisions

### What Makes a Good Component Test

A good test validates **external user-visible behavior**, not implementation details. It should:
- Query elements the way a user or assistive technology would find them (by role, label, text)
- Interact with elements the way a user would (click, type, tab — not call methods)
- Assert what the user would see or hear (visible text, accessible names, enabled/disabled state)
- Survive a refactoring that doesn't change user-facing behavior

If a test breaks because an internal signal was renamed, a CSS class changed, or a DOM element was restructured — but the user experience is identical — that test was testing implementation details.

### Testing Boundary Table

| Artifact Type | Testing Tool | Mock Boundary |
|--------------|-------------|---------------|
| Dumb components | ATL (`renderWithProviders`) | None — isolated with `componentInputs` and `on` |
| Containers / Pages | ATL (`renderWithProviders`) | Feature service (controllable signals) |
| Root component | ATL (`renderWithProviders`) | `ConfigService` (controllable signals) |
| Feature services | TestBed + `HttpTestingController` | HTTP layer |
| Auth/shared services | TestBed + `HttpTestingController` | HTTP layer |
| Pure functions | Plain Vitest | None |
| Guards | TestBed | Injected services |
| Interceptors | TestBed + `HttpTestingController` | HTTP layer |

### Modules with Tests

**All 10 migrated component test files** — each rewritten to ATL patterns:
- Dumb components: black-box tests via `renderWithProviders()`, `componentInputs`, `on`, semantic queries
- Smart components: render with real children, mock feature services with controllable signals, test data flow from loading through success/error states
- Root component: mock `ConfigService` signals, test conditional rendering of config error vs layout

**4 unchanged test files** — remain as-is:
- Service tests: `TestBed` + `HttpTestingController` (correct boundary for service tests)
- Pure function tests: plain input/output assertions (no framework needed)

### Prior Art

- The root app spec already uses `TranslateModule.forRoot()` (no FakeLoader) — this is the pattern being standardized across all tests
- The existing service tests (auth service spec, profile service spec) demonstrate the correct pattern for service-level testing that remains unchanged

## Out of Scope

- **Service test migration**: Service tests remain with `TestBed` + `HttpTestingController`. ATL is a component rendering library and does not apply to service tests.
- **Pure function test changes**: Auth config spec and profile display name spec are plain unit tests that need no framework.
- **New test coverage**: This migration rewrites existing tests to ATL patterns. It does not add tests for untested components or increase coverage scope.
- **E2E test changes**: The E2E project is entirely separate and unaffected.
- **Backend test changes**: Backend tests are unaffected.
- **Accessibility audits**: While ATL's semantic queries naturally improve accessibility enforcement, this PRD does not include a dedicated accessibility audit or remediation of components that fail ATL queries. Components that can't be found by role will need fixes during migration, but that is incidental, not the goal.
- **Custom ESLint rules**: No `eslint-plugin-testing-library` is added. Forbidden patterns are enforced by convention, documentation, and code review.
- **Visual regression testing**: Not in scope.

## Further Notes

- **Angular 21 compatibility**: Angular Testing Library supports Angular 21. The `@testing-library/angular` package wraps Angular's `TestBed` internally, so it is compatible with standalone components, signals, and `OnPush` change detection.

- **Vitest compatibility**: `@testing-library/jest-dom` provides a `/vitest` entry point specifically for Vitest integration. The `setupFiles` mechanism in `angular.json`'s `@angular/build:unit-test` builder supports this pattern.

- **Translation passthrough mechanism**: `TranslateModule.forRoot()` with no arguments instantiates `TranslateNoOpLoader` (returns `of({})`). Every key lookup misses, triggering `DefaultMissingTranslationHandler` which returns `params.key`. So `{{ 'SOME.KEY' | translate }}` renders the literal string `SOME.KEY`. This is already proven in the existing app spec.

- **`rxResource` mock shape**: For container tests that mock `HealthFeatureService`, the fake must replicate the `rxResource` public API: `.value()`, `.isLoading()`, `.error()`, `.reload()`. These are implemented as plain signals and `vi.fn()` in the test.

- **Profile menu complexity**: The profile menu component spec is the most complex migration. The current test uses `TestHostComponent`, `createHost()`, `asAny()`, and directly calls private methods (`toggle()`, `onProfileClick()`, `onDocumentClick()`). The ATL version replaces all of this with: click the avatar button to open the dropdown, click menu items, click outside to close — pure black-box user interaction testing.

- **No incremental migration**: A big-bang approach was chosen over incremental migration because (a) the codebase has only 10 component test files, (b) having two patterns simultaneously creates confusion, and (c) the `renderWithProviders` utility and `setupFiles` configuration benefit all tests immediately.

- **Recipe card component**: This component exists in the codebase but has no test file. It is not in scope for this migration (which rewrites existing tests only), but should be tested using ATL patterns when tests are added.
