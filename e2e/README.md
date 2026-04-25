# E2E Test Infrastructure

End-to-end tests run against a deployed preview environment using Playwright and Chromium. They validate core user journeys through the real application stack (frontend, backend, Cognito).

## Authentication Strategy

Tests authenticate identically to real users — via the Cognito Hosted UI in a headless browser. No SDK shortcuts, no synthetic tokens.

### Why Not Use the Cognito SDK Directly?

The AWS SDK's `USER_PASSWORD_AUTH` flow (via `InitiateAuthCommand`) was the original approach but produces fundamentally broken tokens for this application:

- **Missing scopes.** The `USER_PASSWORD_AUTH` flow returns access tokens without `openid`, `profile`, or `email` scopes. These scopes are only granted through the Hosted UI / authorization code flow.
- **UserInfo endpoint rejects the token.** The backend calls Cognito's UserInfo endpoint with the access token to fetch profile data. Without the required scopes, UserInfo returns an error.
- **Fallback yields incomplete claims.** The backend falls back to decoding JWT claims from the access token, but `USER_PASSWORD_AUTH` access tokens only contain `sub` and `cognito:groups` — not `name`, `email`, or other profile attributes.
- **Result.** Profile pages load but display name and email are empty. Tests that assert on user identity (display name in navbar, profile page fields) fail.

The only way to get tokens with full scopes is the authorization code flow through the Hosted UI — which is exactly what real users do. The headless browser login replicates this flow precisely.

### Global Setup (`global-setup.ts`)

Runs once before all tests. For each test user (`demo@breadly.app`, `admin@breadly.app`):

1. Launches a headless Chromium instance.
2. Navigates to a protected route (`/recipes`), triggering the OIDC redirect to the Cognito Hosted UI.
3. Fills the username/password form on the Cognito Hosted UI and submits.
4. Waits for the OIDC callback to complete — the app redirects back to `/recipes` and `angular-oauth2-oidc` stores tokens in `localStorage`.
5. Extracts all `localStorage` entries (access token, ID token, expiry, scopes).
6. Writes them to `.auth/user.json` or `.auth/admin.json`.

This produces production-identical tokens with full scopes (`openid`, `profile`, `email`), so the backend's UserInfo endpoint works correctly and profile data (display name, email) is available.

### Global Teardown (`global-teardown.ts`)

Deletes the `.auth/` directory after all tests complete.

### Auth Fixture (`fixtures/auth.fixture.ts`)

Each authenticated test uses the `authSession` fixture (auto-applied). It:

1. Reads the storage state JSON for the requested role (`user` or `admin`).
2. Injects `localStorage` entries into the browser context via `addInitScript` — runs before any page navigation, so the app sees valid tokens immediately.
3. Navigates to the app root and verifies the navbar shows a logged-in state.
4. After the test, attempts to log out (failure is ignored to avoid masking test errors).

Tests select their role with `test.use({ role: 'user' })` or `test.use({ role: 'admin' })`.

## Test Suite

All tests run sequentially (`workers: 1`) on two projects: **desktop** (1280x720) and **mobile** (375x812, Pixel 7). Total: 14 test runs (7 per viewport), 2 skipped smoke tests.

### `auth/sign-in-out.spec.ts` — Sign in and out

Does **not** use the auth fixture. Starts with empty `storageState` and walks through the full login flow:

- Navigates to `/recipes` (unauthenticated), gets redirected to the Cognito Hosted UI.
- Verifies the auth domain matches the environment (`preview.auth.appdock.ch`).
- Fills credentials, submits, waits for redirect back to `/recipes`.
- Verifies the navbar shows a logged-in state.
- Logs out and verifies the home page with login button is shown.

This is the only test that exercises the real Cognito redirect flow at test time.

### `navigation/browse-pages.spec.ts` — Browse pages

Role: `user`. Verifies navbar-driven navigation:

- Navigates to recipes, checks the page title.
- Verifies the display name ("Demo User") in the profile menu.
- Navigates to profile, checks the page title.
- Navigates to home, checks the page title.

### `profile/view-profile.spec.ts` — View profile

Role: `user`. Navigates to the profile page and verifies:

- User ID is present.
- Display name matches "Demo User".
- Email matches "demo@breadly.app".

This test validates that the tokens carry full user claims — the original motivation for the headless browser login approach.

### `health/view-health.spec.ts` — View health dashboard

Role: `admin`. Two tests:

1. Navigate to health page, verify all system statuses are operational, response times are visible, versions are displayed.
2. Reload health data and verify the dashboard updates.

### `recipes/manage-recipe.spec.ts` — Manage recipes

Role: `user`. Full CRUD journey:

- Creates a recipe with a unique name (prefixed with `[E2E-manage-recipe]`).
- Verifies it appears in the list.
- Deletes the recipe.
- Verifies it disappears from the list.

### `smoke/monitoring.smoke.spec.ts` — External monitoring (skipped)

Monitors an external booking page. Skipped by default (`describe.skip`), run separately via `npm run test:smoke`.

## Configuration

Environment variables in `.env`:

| Variable | Purpose |
|----------|---------|
| `E2E_BASE_URL` | Deployed environment URL (e.g., `https://preview.breadly.appdock.ch/preview/fix-e2e/`) |
| `E2E_DEMO_USERNAME` | Demo user email |
| `E2E_DEMO_PASSWORD` | Demo user password |
| `E2E_ADMIN_USERNAME` | Admin user email |
| `E2E_ADMIN_PASSWORD` | Admin user password |

## Running

```bash
npm test              # All tests (headless)
npm run test:headed   # All tests (visible browser)
npm run test:ui       # Playwright UI mode
npm run test:smoke    # Smoke tests only
npm run report        # Open HTML report
```
