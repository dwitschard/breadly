# PRD: End-to-End Testing with Playwright

## Problem Statement

Breadly has unit and integration tests for both frontend and backend, but no end-to-end tests that validate the full user experience across the stack. This means:

- No automated verification that frontend, backend, authentication, and database work together correctly from a user's perspective.
- Regressions in cross-cutting flows (login, recipe CRUD, navigation) are only caught by manual testing or after deployment to dev.
- New features ship without any guarantee that the complete user journey works, only that individual components and API endpoints pass isolated tests.
- There is no way to catch visual breakages, broken navigation, or auth flow regressions before merging to main.
- The preview environments (already deployed per branch) have no automated validation running against them.

## Solution

Add a Playwright-based end-to-end testing suite that runs against the deployed preview environments. Each feature branch's preview environment is automatically tested after deployment, and the main branch deploys a temporary preview for E2E validation before promoting to dev. E2E is a required status check for merging PRs.

Tests are organized as user journeys (one spec file per journey) and interact with the application exclusively through Page Objects. Test data is created and cleaned up via the real API, ensuring isolation across parallel branch runs on the shared MongoDB. Authentication is handled programmatically via Cognito's `InitiateAuth` API, with one dedicated test validating the full UI login flow.

The E2E suite runs in two viewports (desktop 1280x720 and mobile 375x812), sequentially with no retries, using Chromium only. Videos, screenshots, traces, and an HTML report are uploaded as GitHub artifacts on failure.

## User Stories

1. As a developer, I want E2E tests to run automatically after my preview environment deploys, so that I know my full-stack changes work before asking for review.

2. As a developer, I want E2E test results to appear as a required status check on my PR, so that I cannot merge broken user journeys into main.

3. As a developer, I want E2E tests to block the main branch deployment to dev, so that the dev environment only receives code that passes full user journey validation.

4. As a developer, I want to see video recordings and traces of failed E2E tests in GitHub Actions artifacts, so that I can debug failures without reproducing them locally.

5. As a developer, I want to run E2E tests locally against my local dev environment, so that I can iterate on tests without waiting for CI.

6. As a developer, I want Page Objects to encapsulate all DOM interactions, so that my test files read like plain English descriptions of user behavior.

7. As a developer, I want `data-testid` attributes on key interactive elements, so that my E2E selectors are resilient to CSS and markup changes.

8. As a developer, I want each test to create and clean up its own data via API calls, so that parallel E2E runs from different branches don't corrupt each other on the shared MongoDB.

9. As a developer, I want authentication handled programmatically in test setup, so that tests start already logged in and run fast without navigating through the Cognito UI every time.

10. As a developer, I want one dedicated E2E test that validates the full Cognito login/logout UI flow, so that auth regressions in the real login experience are caught.

11. As a developer, I want E2E tests to run in both desktop and mobile viewports, so that responsive layout regressions are caught automatically.

12. As a developer, I want a warm-up health check in the global setup, so that Lambda cold starts don't cause the first test to flake with a timeout.

13. As a developer, I want clear conventions documented for writing new E2E tests, so that every new feature I build includes a corresponding user journey test.

14. As a developer, I want the E2E project to live at the monorepo root with its own `package.json`, so that it's independent of the frontend and backend build systems.

15. As a developer, I want E2E artifacts retained for 7 days, so that I have enough time to investigate failures without accumulating excessive storage.

16. As a code reviewer, I want to see E2E pass as a green check on the PR, so that I have confidence the feature works end-to-end before approving.

17. As a developer, I want test data to use unique prefixes per test (e.g., `[E2E-manage-recipe]`), so that I can identify which test created which data if cleanup fails.

18. As a developer, I want the E2E suite to run sequentially with no retries, so that flaky tests are surfaced immediately rather than masked by retry logic.

19. As a developer, I want the main branch E2E workflow to deploy a temporary preview environment, run tests, and tear it down, so that E2E validation on main doesn't depend on or affect the dev environment.

20. As a developer, I want Playwright browser binaries cached in CI, so that E2E setup doesn't re-download Chromium on every run.

## Implementation Decisions

### E2E Project Location and Tooling

The E2E project lives at the monorepo root in an `e2e/` directory with its own `package.json`, `playwright.config.ts`, and `tsconfig.json`. It is independent of both the frontend and backend projects. It uses npm (matching the rest of the monorepo) and Node 24 (matching CI).

Playwright is configured with:
- Chromium only (no Firefox or WebKit).
- Sequential execution (`workers: 1`), no retries.
- Timeouts: 30s per test, 10s per action, 60s per navigation (generous for Lambda cold starts).
- Two Playwright projects: `desktop` (1280x720) and `mobile` (375x812, iPhone 14 equivalent).
- Video, screenshot, and trace capture on failure only (`retain-on-failure`).
- HTML report generated on every run.

### Folder Structure

```
e2e/
  package.json
  playwright.config.ts
  tsconfig.json
  global-setup.ts
  global-teardown.ts
  pages/
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
  fixtures/
    auth.fixture.ts
    api.fixture.ts
  helpers/
    cognito.helper.ts
    test-data.helper.ts
  tests/
    recipes/
      manage-recipe.spec.ts
    auth/
      sign-in-out.spec.ts
    navigation/
      browse-pages.spec.ts
    profile/
      view-profile.spec.ts
  .auth/                    # gitignored storageState files
```

### Authentication Strategy

A Cognito Auth Helper in `helpers/cognito.helper.ts` handles programmatic authentication. It calls Cognito's `InitiateAuth` API using the `USER_PASSWORD_AUTH` flow (enabled on preview Cognito pools via `enable_admin_password_auth = true`) to acquire `id_token` and `access_token`. The tokens are stored in the `localStorage` format that `angular-oauth2-oidc` expects, then saved as a Playwright `storageState` JSON file.

The `global-setup.ts` calls this helper for the demo user, writes the storageState to `.auth/user.json`, then performs a health-check warm-up (`GET /api/health`) with retries to absorb Lambda cold starts.

Credentials come from existing GitHub secrets: `PREVIEW_DEMO_PASSWORD`, `PREVIEW_ADMIN_PASSWORD`. The Cognito User Pool ID and Client ID are passed as environment variables from Terraform outputs.

One dedicated test (`sign-in-out.spec.ts`) validates the full Cognito Hosted UI login and logout flow using Playwright browser automation, without relying on the programmatic auth shortcut.

### Test Data Strategy

Each test creates its own data via the real API using Playwright's API request context. Test data uses unique identifiers with the pattern `[E2E-<test-name>] <data>` (e.g., `[E2E-manage-recipe] Banana Bread`). Tests clean up their own data in `afterAll` / `afterEach` via `DELETE` API calls. This ensures isolation across parallel branch runs on the shared MongoDB.

A Test Data Helper in `helpers/test-data.helper.ts` provides factory functions for creating and cleaning up test entities.

### Page Object Pattern

One Page Object per page/route, covering all descendant component interactions. Page Objects are organized by feature (mirroring the frontend structure). They encapsulate all selectors (preferring `data-testid` attributes) and expose action methods and assertion helpers. Test spec files never reference selectors directly; they only call Page Object methods.

Convention: Page Objects expose methods named after user actions (`createRecipe(data)`, `expectRecipeVisible(name)`, `navigateTo('recipes')`), not technical DOM operations.

### `data-testid` Attribute Convention

`data-testid` attributes are placed selectively on interactive elements and key structural elements that Page Objects need to locate. Naming follows `<feature>-<element>` format (e.g., `recipe-list-item`, `recipe-create-btn`, `nav-recipes-link`, `profile-email`). Not every element gets a `data-testid`; only those where CSS-cascade selectors would be brittle. Enforcement is by convention and code review, documented in the frontend AGENTS.md.

### Spec File Naming

Spec files follow the `<verb>-<noun>.spec.ts` convention, describing the user journey in 1-2 words. Each spec file represents one complete user journey.

### CI Pipeline Integration

**Non-main branches:** A new `e2e` job is added to `preview-deploy.yml`, running after `deploy-preview`. It installs Playwright (with cached browser binaries), runs the E2E suite against the branch's preview URL, and uploads artifacts. The preview URL and Cognito credentials are passed from the deploy job's Terraform outputs.

**Main branch:** A new dedicated workflow deploys a temporary preview environment (using the same preview infrastructure with a fixed slug), runs E2E against it, tears it down (full `terraform destroy`), and only then triggers the dev deployment. E2E failure blocks the dev deploy.

**Required status check:** The E2E job name is configured as a required status check on the main branch protection rule. PRs cannot merge unless E2E passes.

### Artifact Storage

Videos, screenshots, traces, and the HTML report are uploaded via `actions/upload-artifact` with `if: always()` and 7-day retention. Videos and traces use `retain-on-failure` mode; the HTML report is always uploaded.

### Playwright Browser Installation in CI

Chromium is installed via `npx playwright install --with-deps chromium`. Browser binaries are cached using `actions/cache` keyed on the Playwright version from `package-lock.json`.

### Base URL Configuration

The E2E base URL is passed as an environment variable `E2E_BASE_URL`. In CI, this comes from the CloudFront URL + branch slug (for preview branches) or the temporary preview URL (for main). Locally, it defaults to `http://localhost:4200`. Playwright config reads `process.env.E2E_BASE_URL`.

### Local Development Support

Developers can run E2E tests locally against `ng serve` + the local backend. Playwright config supports a local profile. Authentication uses the same programmatic Cognito flow, requiring the developer to have access to a Cognito instance (preview or local).

### Documentation Updates

A new E2E testing section is added to `breadly-frontend/AGENTS.md` covering: Playwright conventions, page object patterns, `data-testid` naming, spec file naming, fixture usage, test data strategy, and how to write E2E tests for new features.

The root `AGENTS.md` is updated: the Development Pipeline gains a new phase for E2E test writing, the verification commands table includes the E2E project, and the Definition of Done requires E2E tests for new features.

### Initial Test Suite

Four user journey specs are implemented:

1. **`manage-recipe.spec.ts`**: Create a recipe via the form, verify it appears in the list, open the detail view, edit the recipe, verify changes persist, delete the recipe, confirm it is removed from the list.

2. **`sign-in-out.spec.ts`**: Visit a protected page while unauthenticated, get redirected to the login page, complete the Cognito Hosted UI login flow with demo credentials, arrive at the recipes page, verify the navbar shows the authenticated user, log out, verify the user is logged out.

3. **`browse-pages.spec.ts`**: As an authenticated user, navigate between recipes, profile, and health pages via the navbar. Verify each page loads its expected content. Test responsive behavior across desktop and mobile viewports.

4. **`view-profile.spec.ts`**: As an authenticated user, navigate to the profile page. Verify the profile displays the correct email, roles, and other JWT-derived claims for the demo user.

## Testing Decisions

A good E2E test validates external user-visible behavior, not implementation details. Tests should assert what the user sees and experiences (page content, navigation outcomes, form submissions) rather than internal signal states, service method calls, or DOM structure. If a test would break from a pure refactoring that doesn't change user behavior, it's testing implementation details.

### Modules with Automated Tests

**Cognito Auth Helper (`helpers/cognito.helper.ts`):**
- Unit tests validating token acquisition, storageState format (matches `angular-oauth2-oidc` localStorage keys), retry logic for health check warm-up, and error handling for invalid credentials.
- Mock the AWS SDK `CognitoIdentityProviderClient` to avoid real Cognito calls in tests.

**Test Data Helper (`helpers/test-data.helper.ts`):**
- Unit tests validating unique name generation, recipe factory output shape, and cleanup behavior.
- Mock the Playwright API request context.

**Page Objects (`pages/**/*.page.ts`):**
- Tests validating that Page Object methods correctly target expected `data-testid` attributes and compose correct action sequences.
- These can be lightweight structural tests verifying the PO API surface, not full browser tests.

**The E2E spec files themselves** are the integration tests for the entire system. They validate user journeys end-to-end against a real deployed environment.

### Modules Without Automated Tests

- **CI workflows**: Validated by running them on a test branch. No workflow unit testing.
- **Playwright config**: Validated by the E2E suite itself running correctly.
- **`data-testid` placement**: Validated by E2E tests (if a `data-testid` is missing, the Page Object can't find the element and the test fails).

## Out of Scope

- **Visual regression testing**: No screenshot comparison or tools like Percy/Chromatic. E2E tests validate behavior, not pixel-level appearance.
- **Performance testing**: No Lighthouse, Core Web Vitals, or load testing. E2E tests validate functionality only.
- **API-only tests**: The E2E suite tests the frontend user experience. Backend API tests remain in the backend project as supertest integration tests.
- **Cross-browser testing**: Only Chromium. Firefox and WebKit can be added later if cross-browser issues arise.
- **Accessibility E2E testing**: Accessibility is covered by AXE checks in unit tests (per frontend AGENTS.md). E2E tests focus on user journeys.
- **Seed script implementation**: The backend seed script (`scripts/seed.mjs`) is a separate concern. E2E tests create their own data via API calls.
- **Notification on E2E failure**: No Slack/email notifications. Developers check PR status checks.
- **E2E for admin-specific flows**: Initial suite covers the demo user (USER group). Admin-specific journeys can be added later.
- **Parallel test execution**: Tests run sequentially. Parallel execution can be revisited once the suite grows large enough to warrant it.
- **Custom Playwright reporters**: The built-in HTML reporter is sufficient. No custom reporters, dashboards, or external reporting services.

## Further Notes

- **Lambda cold starts**: Preview backends run on AWS Lambda. The first request after deployment or inactivity incurs a cold start (typically 1-3 seconds). The global setup health-check warm-up mitigates this. The 60-second navigation timeout provides additional safety. If cold starts remain an issue, provisioned concurrency can be added to the preview Lambda Terraform module, though this increases cost.

- **Shared MongoDB isolation**: All preview environments share a single MongoDB Atlas cluster. E2E tests from different branches could theoretically create recipes with identical names. The `[E2E-<test-name>]` prefix convention and per-test cleanup minimize this risk, but it is not eliminated. If collisions become a problem, adding a branch slug to the prefix (`[E2E-<slug>-<test>]`) provides stronger isolation.

- **Cognito token expiry**: Tokens acquired in `globalSetup` have a default 1-hour TTL from Cognito. If the E2E suite takes longer than 1 hour (unlikely with 4 tests), tokens will expire mid-run. The suite can be extended to refresh tokens if this becomes an issue.

- **StorageState format**: The `angular-oauth2-oidc` library stores tokens in `localStorage` under keys like `access_token`, `id_token`, `expires_at`, `nonce`, etc. The Cognito helper must replicate this exact key/value format. If the library updates its storage format, the helper must be updated accordingly.

- **Preview teardown on main**: The main branch E2E workflow deploys and destroys a temporary preview environment on every push. This adds approximately 5-8 minutes to the main pipeline (Terraform apply + E2E + Terraform destroy). This is acceptable given that main pushes are less frequent (only after PR merges).

- **`data-testid` in production builds**: `data-testid` attributes are left in production HTML. They have no performance impact and can aid in production debugging. Stripping them would require a build plugin and adds complexity without meaningful benefit.

- **Future test growth**: As features are added, each new feature should include at least one E2E user journey spec. The AGENTS.md development pipeline update ensures this is part of the Definition of Done. The sequential execution model may need to be revisited when the suite exceeds 20-30 tests, at which point parallel execution with `workers > 1` becomes worthwhile.

- **Mobile viewport limitations**: Some interactions may behave differently on mobile (e.g., hamburger menu vs. full navbar). Page Objects should abstract these differences so that spec files are viewport-agnostic. If a Page Object needs viewport-specific logic, it can check the viewport size via Playwright's `page.viewportSize()`.
