# PRD: DynamoDB User Data & Settings

## Problem Statement

Breadly has no persistent store for user-specific data beyond what Cognito provides via JWT claims. This creates several problems:

- User preferences (display language, UI theme) cannot be saved. Every session resets to defaults, and there is no way to honour a user's previously chosen settings across devices.
- Reminders exist exclusively in AWS EventBridge Scheduler. There is no database record of them. Listing reminders requires a paginated API call to EventBridge, which is slow and rate-limited. Fired reminders leave no trace — there is no history. A hard cap of 10 active reminders per user is enforced entirely in application code because there is no cheaper way to count them.
- Adding any future user-scoped data (preferences, history, profile overrides) would require introducing a new data store from scratch each time, with no shared foundation.

## Solution

Introduce a single AWS DynamoDB table (`breadly-<env>`) as the persistent store for all user-scoped structured data. The initial scope covers two entities: **user settings** (language and theme preference) and **reminder shadow records** (a DynamoDB copy of every reminder, kept in sync with EventBridge).

User settings are exposed via new API endpoints and editable on the Profile page. Theme and language changes take effect immediately in the UI. Reminder shadow records are written transparently alongside existing EventBridge operations — the user-facing reminder experience is unchanged, but reads become fast and history is preserved. DynamoDB connectivity is surfaced in the health dashboard alongside the existing MongoDB check.

## User Stories

1. As a user, I want my chosen display language to be saved, so that I see the app in my preferred language on every visit and device.
2. As a user, I want my chosen theme (light or dark) to be saved, so that I do not have to reselect it each time I open the app.
3. As a user, I want my theme to apply immediately when I change it, so that I can see the effect without reloading the page.
4. As a user, I want my language to switch immediately when I change it, so that I can confirm the correct language was selected without reloading the page.
5. As a user, I want my settings to be loaded automatically when I open the Profile page, so that the current values are pre-populated in the selectors.
6. As a user, I want settings changes to feel instant, so that the UI does not block or show a spinner while the server round-trip completes.
7. As a user, I want my settings to revert if saving fails, so that the displayed value always reflects what is actually stored.
8. As a user, I want to see my list of reminders quickly, so that I am not waiting on slow external API calls when I open the reminder list.
9. As a user, I want past reminders that have already fired to remain visible in the reminder list, so that I have a record of what was sent.
10. As a user, I want fired reminders to be clearly marked as inactive, so that I can distinguish them from upcoming reminders.
11. As a user, I want fired reminders to be automatically cleaned up after a short period, so that old history does not clutter the list indefinitely.
12. As an admin, I want the health dashboard to report DynamoDB connectivity separately from MongoDB, so that I can identify which data store is degraded during an incident.
13. As an admin, I want DynamoDB to appear in the health check with the same visual treatment as other checks, so that the dashboard remains consistent as dependencies are added or removed.

## Implementation Decisions

### Single-Table Design

One DynamoDB table per environment (`breadly-dev`, `breadly-prod`, `breadly-preview-<slug>`, `breadly-local`). The table uses a composite primary key:

- **Partition key (PK):** `USER#<cognitoSub>` — string
- **Sort key (SK):** entity discriminator — string

Item types and their sort keys:

| Entity | Sort Key | Attributes |
|---|---|---|
| User Settings | `SETTINGS` | `language`, `theme` |
| Reminder Shadow Record | `REMINDER#<scheduleArn>` | `recipeId`, `scheduledAt`, `title`, `message`, `status` (`active` \| `disabled`), `ttl?` |

No Global Secondary Indexes are introduced. All queries are user-scoped and satisfied by the primary key alone.

### Default Settings Values

When no settings record exists for a user, the defaults are:

- `language`: `"de"` (German)
- `theme`: `"light"`

### Valid Settings Values

Both fields are validated server-side. Any value outside these sets is rejected with a 400.

- `language`: `"de"` | `"en"`
- `theme`: `"light"` | `"dark"`

### TTL on Disabled Reminders

When a reminder fires, its shadow record is updated to `status: disabled` and a `ttl` attribute is set to the current Unix epoch plus 10 days. DynamoDB's TTL mechanism deletes the item automatically after expiry. No cleanup Lambda is needed.

### Reminder Shadow Record Lifecycle

The DynamoDB record must be kept consistent with EventBridge through explicit application code — AWS does not synchronise them automatically:

- **Create:** write shadow record (`status: active`) **before** creating the EventBridge schedule. If EventBridge creation fails, delete the shadow record (rollback) and surface the error to the caller.
- **Delete:** cancel the EventBridge schedule first. On success, delete the shadow record. On EventBridge failure, retry once. If still failing, return an error to the client and leave both records intact — do not delete the shadow record.
- **Fire:** in the existing internal send handler, update the shadow record to `status: disabled` and set `ttl` **before** sending the email. This ensures the record reflects reality even if the email step fails.

### Reminder Shadow Record Migration

Existing EventBridge reminders that predate this feature have no shadow record. They must be migrated: shadow records are created for all existing reminders using `"tbd"` as the value for both `title` and `message`.

### Infrastructure

- Billing mode: `PAY_PER_REQUEST` (no capacity planning required at current traffic).
- One table per environment, matching the existing naming convention.
- The `breadly-local` table is provisioned once in the global Terraform module and shared by all local developer sessions.
- The Lambda execution role receives the minimum required DynamoDB permissions: `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `DescribeTable` on the table ARN only.
- A new environment variable `DYNAMODB_TABLE_NAME` is injected by Terraform and defaults to `breadly-local` in local development.

### Backend Modules

**DynamoDB client module** — singleton `DynamoDBDocumentClient` initialised from environment config. Exposes the client instance and the resolved table name. No business logic.

**UserSettingsRepository** — encapsulates all DynamoDB reads and writes for the `SETTINGS` item. Interface: `getSettings(userId)` and `upsertSettings(userId, patch)`. The repository owns the key construction (`USER#<sub>` / `SETTINGS`) and the attribute mapping. `getSettings` creates and persists the default item (`language: "de"`, `theme: "light"`) if no record exists, then returns it.

**ReminderRepository** — encapsulates all DynamoDB reads and writes for `REMINDER#*` items. Interface: `createRecord(reminder)`, `updateStatus(userId, id, status)`, `deleteRecord(userId, id)`, `listByUser(userId)`. The repository owns TTL calculation for the `disabled` transition.

**ProfileController / ProfileService** — two new routes added: `GET /profile/settings` and `PATCH /profile/settings`. The service delegates to `UserSettingsRepository`. Settings are returned as a flat object `{ language, theme }`. The PATCH route accepts partial updates (either or both fields).

**ReminderService** — existing create, delete, and send-handler methods are extended to call `ReminderRepository` at the appropriate point in each flow.

**HealthService** — the single `database` check is replaced by two independent checks: `mongodb` and `dynamodb`. The DynamoDB check performs a `DescribeTable` call to confirm connectivity. Either check failing sets the overall status to `degraded`.

### API Contract

```
GET  /profile/settings
Response: { language: string, theme: string }
Note: creates and persists default settings if no record exists.

PATCH /profile/settings
Body:    { language?: string, theme?: string }
Response: { language: string, theme: string }
Validation: language must be "de" | "en"; theme must be "light" | "dark". Returns 400 for invalid values.
```

Both endpoints require authentication. The `cognitoSub` is derived from the JWT — it is never accepted as a request parameter.

The existing `GET /profile` endpoint is extended to include a `settings` field in its response, so the frontend init flow retrieves settings in a single call rather than issuing a separate request.

### Health Response Shape Change

```
Before: checks.database  (ok | degraded)
After:  checks.mongodb   (ok | degraded)
        checks.dynamodb  (ok | degraded)
```

The `mongodb` check is a candidate for removal in a future PRD if MongoDB is retired.

### Frontend Modules

**SettingsService** — settings are loaded as part of app initialisation via the existing `GET /profile` call (no separate init request). The service exposes `language` and `theme` as Angular Signals and provides an `updateSetting(key, value)` method that applies an optimistic update to the signal, calls `PATCH /profile/settings`, and reverts the signal on failure. The settings fetch is blocking — the app does not render until it completes. If the fetch fails, an error is shown rather than silently falling back to hardcoded defaults.

**SettingsComponent** — dumb component with `input()` for current values and `output()` for change events. Renders a language selector and a theme selector.

**ProfileContainer** — extended to compose `SettingsComponent` and wire its outputs to `SettingsService.updateSetting()`.

**Theme integration** — a reactive effect (or equivalent) listens to the `theme` signal and toggles the Tailwind dark mode class on the `<html>` element. This runs at app initialisation using the stored preference, and reactively on every subsequent change.

**Language integration** — `TranslateService.use()` is called at app initialisation with the stored language value, and on every subsequent settings change. No page reload is required.

**Health component** — updated to render `mongodb` and `dynamodb` as separate rows, replacing the single `database` row.

### OpenAPI Spec

Two new paths and two new schemas (`UserSettingsDto`, `PatchUserSettingsDto`) are added to the OpenAPI specification. Both frontend and backend regenerate their types from the spec as per the existing convention.

## Testing Decisions

A good test verifies observable external behaviour — inputs and outputs at a module boundary — not internal implementation details. Tests should not assert on how something is done, only on what the caller observes.

### Modules Under Test

**UserSettingsRepository (unit)** — inject a mocked `DynamoDBDocumentClient`. Assert that `getSettings` creates and returns `{ language: "de", theme: "light" }` when no item exists. Assert that `getSettings` returns the stored item when one exists. Assert that `upsertSettings` calls the client with the correct key and attribute values. Prior art: `recipe.service.spec.ts` (mocked dependency pattern).

**ReminderRepository (unit)** — inject a mocked `DynamoDBDocumentClient`. Assert that `updateStatus` to `disabled` sets the `ttl` attribute to approximately 10 days from now. Assert that `listByUser` queries by the correct partition key. Prior art: `recipe.service.spec.ts`.

**ProfileController settings routes (integration)** — use supertest against the running Express app with a mocked `UserSettingsRepository`. Assert correct HTTP status codes, response shapes, and that partial PATCH updates only the supplied fields. Prior art: `recipe.controller.spec.ts` (supertest integration test pattern).

**SettingsService (frontend unit)** — mock the generated API client. Assert that on a successful PATCH the signal retains the new value. Assert that on a failed PATCH the signal reverts to the previous value. Prior art: existing frontend service tests using Vitest.

**E2E user journey** — a single Playwright test that: logs in as a test user, navigates to `/profile`, changes the theme to dark, verifies the dark mode class is present on `<html>`, changes the language, verifies the UI text updates to the selected language, reloads the page, and verifies both settings persist. Prior art: existing Playwright tests in `/e2e`.

## Out of Scope

- Migrating recipes from MongoDB to DynamoDB.
- Adding a Global Secondary Index for cross-user queries (e.g. admin views of all reminders).
- A dedicated `/settings` route — settings are on the Profile page only.
- Reminder history pagination or filtering by status in the UI — all reminders (active and disabled) are returned in a single list.
- Lifting the 10-active-reminder cap — the existing cap remains enforced in application code for now.
- Retiring MongoDB — the `mongodb` health check is retained; removal is a future decision.
- Additional user preference fields beyond `language` and `theme`.
- DynamoDB Local (Docker) for local development — a shared `breadly-local` AWS table is used instead.

## Further Notes

- The Cognito `sub` claim is the canonical user identifier throughout. It is never stored redundantly inside the DynamoDB item body — it is encoded in the partition key only.
- Preview environments each get an isolated DynamoDB table (`breadly-preview-<slug>`), consistent with how all other per-environment resources are provisioned.
- The `breadly-local` table is a shared resource. Developers on the same AWS account will see each other's data during local development. This is acceptable for a small team and avoids the operational burden of per-developer tables or DynamoDB Local.
- DynamoDB TTL deletion is not instantaneous — items may persist for up to 48 hours after their `ttl` timestamp. The application must filter on `status` when listing reminders rather than relying on TTL to have removed disabled items.
