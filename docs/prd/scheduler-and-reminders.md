# PRD: Domain-Agnostic Scheduler & Email Reminders

## Problem Statement

Breadly has no way to perform scheduled or time-based actions. The entire backend is purely request-driven (API Gateway -> Lambda), meaning there is no mechanism to:

- Send periodic batch emails (e.g., a daily greeting to users who haven't cooked recently)
- Trigger per-user one-time reminders (e.g., "remind me about this recipe on Tuesday at 3pm")
- Execute any recurring background job against the existing backend APIs

Without this capability, the application cannot proactively engage users with notifications, and any future feature requiring time-based triggers (scheduled publishing, periodic data cleanup, digest emails) would have no foundation to build on.

## Solution

Add a domain-agnostic scheduler layer that uses AWS EventBridge Scheduler to trigger HTTP calls to internal backend endpoints. The scheduler adds zero new Lambdas — EventBridge Scheduler calls the existing API Gateway directly using IAM authentication. The backend gains a new `/api/internal/*` route prefix secured by IAM auth (not JWT), allowing EventBridge to invoke internal endpoints without a user identity.

The first concrete feature built on this scheduler is **email reminders**: batch cron emails (e.g., a daily greeting) and per-user one-time reminders (e.g., "remind me about this recipe on Tuesday"). Emails are sent via AWS SES using MJML-based templates that are precompiled at build time and interpolated with user-specific variables at send time.

All scheduler configuration — cron schedules, retry policies, email templates, and sender settings — is centralized in a config directory (`breadly-backend/config/`), making it easy to add new scheduled jobs by editing a JSON file and adding an MJML template.

The system is designed for low volume (< 100 concurrent per-user reminders system-wide, soft limit of 10 per user, minute-level timing precision) and adds effectively zero cost at this scale thanks to EventBridge Scheduler's permanent free tier of 14M invocations/month.

## User Stories

1. As a user, I want to set a reminder on a recipe for a specific date and time, so that I receive an email when it's time to cook that recipe.

2. As a user, I want to see a list of all my active reminders, so that I know what upcoming notifications I have scheduled.

3. As a user, I want to cancel a reminder I previously set, so that I stop receiving a notification I no longer need.

4. As a user, I want to receive a daily greeting email, so that I'm reminded to check my recipe collection and stay engaged with the app.

5. As a user, I want reminder emails to be well-formatted and readable on both desktop and mobile, so that I have a pleasant experience regardless of device.

6. As a user, I want reminder emails to link directly to the relevant recipe, so that the email feels actionable.

7. As a developer, I want a domain-agnostic scheduler service that wraps EventBridge Scheduler, so that I can add new scheduled features (e.g., scheduled publishing, digest emails) without reimplementing AWS SDK interaction.

8. As a developer, I want to add new batch cron jobs by editing a single JSON config file and creating an MJML template, so that I don't need to modify Terraform HCL or backend code for each new scheduled email.

9. As a developer, I want retry policies to be configurable per schedule with global defaults, so that I can tune reliability for each job independently.

10. As a developer, I want the scheduler config to support an `enabled` flag per schedule, so that I can toggle jobs on and off without deleting them.

11. As a developer, I want internal endpoints to be documented in the OpenAPI spec with an `Internal` tag, so that generated types are available and the API contract is explicit.

12. As a developer, I want internal endpoints to skip JWT authentication and rely on API Gateway IAM auth instead, so that EventBridge can call them without a user identity.

13. As a developer, I want MJML templates to be precompiled at build time with zero runtime dependencies in Lambda, so that the bundle size is not affected and cold starts remain fast.

14. As a developer, I want email variable interpolation (e.g., `{{userName}}`) to happen at send time — not build time — so that each email is personalized for the recipient.

15. As a developer, I want the scheduler infrastructure to only deploy in dev and prod environments, so that preview environments remain lightweight and don't trigger side effects like sending real emails.

16. As a developer, I want the email helper to be isolated and independently testable, so that I can verify template loading, variable interpolation, and SES integration without testing the full reminder flow.

17. As a developer, I want all scheduler-related configuration (schedules, templates, retry policies) co-located in `breadly-backend/config/`, so that the scheduler is a self-contained, portable configuration package.

18. As a developer, I want EventBridge schedules to follow a consistent naming convention (`breadly-{env}-reminder-{userId}-{uuid}`), so that per-user schedules can be listed and managed via prefix filtering.

19. As a developer, I want the private Lambda's IAM role to include only the minimum required permissions (EventBridge Scheduler + SES), so that the principle of least privilege is maintained.

20. As a developer, I want a `.controller.http` file for the reminder endpoints, so that I can manually test both user-facing and internal routes during development.

21. As an operator, I want EventBridge Scheduler's built-in retry (3 attempts, 1 hour max event age) to handle transient failures automatically, so that a Lambda cold start or temporary SES issue doesn't silently drop a reminder.

22. As an operator, I want SES to start in sandbox mode with a verified sender identity, so that I can test email delivery safely before requesting production access.

## Implementation Decisions

### Architecture

- **Zero new Lambdas.** EventBridge Scheduler targets the existing API Gateway directly using the Universal Target with IAM authentication (SigV4). No intermediary dispatcher Lambda is needed.
- **API Gateway IAM-auth routes.** A new route pattern `ANY /api/internal/{proxy+}` is added to the existing API Gateway HTTP API with `authorization_type = "AWS_IAM"`. This route targets the existing private Lambda.
- **Internal route authentication.** Internal routes (`/api/internal/*`) are registered in `app.ts` before the `requireAuth()` middleware, following the same pattern as existing `/api/public/*` routes. API Gateway IAM auth is the security layer; the backend does not verify SigV4 signatures (API Gateway already validated them).
- **EventBridge Scheduler as sole source of truth for schedule data.** No MongoDB collection for reminders. Schedule metadata is stored in the EventBridge schedule's target payload. The user-facing `GET /api/reminders` endpoint calls `ListSchedules` with a `NamePrefix` filter and parses results. This accepts tradeoffs (no rich querying, ~200-500ms latency, cursor-based pagination) in exchange for fewer moving parts.
- **Schedule naming convention.** All schedules follow the pattern `breadly-{env}-{feature}-{userId}-{uuid}` to enable prefix-based filtering per user via the `ListSchedules` API.
- **Private Lambda only** receives new IAM permissions (EventBridge Scheduler + SES). The public Lambda is unchanged. Only the private Lambda handles both user-facing and internal reminder routes.
- **Schedule ownership verification.** When a user calls `DELETE /api/reminders/:id`, ownership is verified by parsing the userId segment from the EventBridge schedule name (`breadly-{env}-reminder-{userId}-{uuid}`). If the authenticated user's ID does not match the userId in the schedule name, the request is rejected with 403.
- **Per-user reminder limit.** A soft limit of 10 active reminders per user is enforced at the API level. `POST /api/reminders` calls `listSchedules` with the user's prefix and rejects with 409 if the count is >= 10.
- **Timezone handling for per-user reminders.** The client sends `scheduledAt` as an ISO 8601 datetime with UTC offset (e.g., `2026-04-25T15:00:00+02:00`). The backend converts this to UTC for the EventBridge `at()` schedule expression. EventBridge executes at the correct absolute point in time regardless of DST.
- **Timezone handling for cron schedules.** Recurring cron schedules in `schedules.json` include a `timezone` field (IANA format, e.g., `Europe/Zurich`). EventBridge Scheduler natively supports timezone-aware cron expressions, ensuring DST transitions are handled correctly.
- **Email personalization.** In this iteration, all emails use a static placeholder name (`"Breadly User"`) instead of a real user name. This avoids the need for a user profile collection or OIDC token claim lookup. When a profile feature is added later, the placeholder can be replaced with the actual user name.
- **dev/prod only.** Scheduler infrastructure is not deployed in preview environments to avoid side effects and orphaned resources.

### Config-Driven Scheduling

- **Centralized config** at `breadly-backend/config/`. Contains `schedules.json` (schedule definitions, retry policies, email metadata) and `templates/*.mjml` (email templates).
- **Config schema.** `schedules.json` has a `defaults` block (global retry policy, sender email) and a `schedules` array. Each schedule entry defines: `name`, `description`, `enabled`, `schedule_expression`, `timezone` (IANA timezone for cron evaluation, e.g. `Europe/Zurich`), `target` (method + path), `retry_policy` (nullable, falls back to defaults), `email` (template name, subject with `{{variables}}`, optional sender override), and `payload` (arbitrary JSON passed to the internal endpoint — for batch jobs, includes `type` and `userIds`).
- **Terraform reads the config.** The scheduler Terraform module reads `schedules.json` via `jsondecode(file(...))` and creates EventBridge recurring schedules with `for_each`. The `enabled` flag controls whether a schedule is created.
- **Adding a new cron job** requires: (1) add an entry to `schedules.json`, (2) create an MJML template in `config/templates/`, (3) add the internal endpoint in the backend, (4) run `terraform apply`.

### Email System

- **AWS SES** for email delivery, starting in sandbox mode with a single verified sender email identity.
- **MJML precompiled templates.** `.mjml` files in `config/templates/` are compiled to `.html` files in `dist/templates/` at build time via an `npm run compile-templates` script. MJML is a `devDependency` only — zero runtime dependencies shipped to Lambda.
- **Runtime variable interpolation.** Compiled HTML templates contain `{{variable}}` placeholders that MJML passes through untouched during compilation. At send time, a simple `interpolate()` function replaces placeholders with user-specific values (name, app URL, recipe details, etc.).
- **Build pipeline change.** The backend `build` script becomes `compile-templates && tsc`. The `backend.zip` artifact includes `dist/templates/` alongside the existing `dist/` JS output.

### Backend Feature Structure

- **Two features** in the backend, enforcing domain-agnostic design:
  - `src/features/scheduler/` — Generic EventBridge Scheduler SDK wrapper. Knows nothing about reminders, recipes, or emails. Exposes `createSchedule()`, `deleteSchedule()`, `listSchedules()`.
  - `src/features/reminder/` — Domain-specific reminder logic. Uses the scheduler service for schedule management and the email helper for template rendering + SES delivery.
- **Email helper** in the reminder feature (`email.helper.ts`) encapsulates template loading, variable interpolation, and SES sending as three isolated, testable functions.
- **Reminder controller** exposes two sets of routes:
  - User-facing (with `requireAuth()`): `POST /api/reminders`, `GET /api/reminders`, `DELETE /api/reminders/:id`
  - Internal (without `requireAuth()`): `POST /api/internal/reminders/send`, `POST /api/internal/reminders/batch`

### API Contract

- Internal endpoints are added to the OpenAPI spec in `breadly-api/openapi.yaml` with an `Internal` tag. This generates TypeScript DTOs for request/response types, keeping the spec as the single source of truth.
- User-facing endpoints are added under a `Reminders` tag.
- Schemas:
  - `CreateReminderDto`: `recipeId` (string, required), `scheduledAt` (string, ISO 8601 with UTC offset, required), `title` (string, optional), `message` (string, optional). The backend validates that `scheduledAt` is in the future and enforces a per-user soft limit of 10 active reminders.
  - `Reminder`: `id` (string — the EventBridge schedule name), `recipeId` (string), `scheduledAt` (string, ISO 8601), `title` (string, optional), `message` (string, optional).
  - `ReminderList`: `items` (array of `Reminder`), `nextToken` (string, optional — cursor for EventBridge pagination).
  - `SendReminderPayload`: payload for the internal single-reminder send endpoint (fields TBD by implementation, must include recipe and recipient info).
  - `BatchReminderPayload`: `type` (string, e.g. `"greeting"`), `userIds` (array of strings — explicit list of user IDs to target).

### Infrastructure Modules

- **New `scheduler` Terraform module** (`infrastructure/aws/modules/scheduler/`): EventBridge Schedule Group, IAM execution role for EventBridge-to-API-Gateway, recurring schedules from config, retry policy resolution.
- **New `ses` Terraform module** (`infrastructure/aws/modules/ses/`): SES email identity, IAM policy for sending.
- **Modified `api_gateway` module**: New `ANY /api/internal/{proxy+}` route with IAM authorization.
- **Modified `lambda_express` module**: Optional extra IAM policy attachment for EventBridge Scheduler + SES permissions. New environment variables: `SCHEDULER_GROUP_NAME`, `SCHEDULER_ROLE_ARN`, `API_GATEWAY_ENDPOINT`, `SES_SENDER_EMAIL`.
- **Modified `deploy/main.tf`**: Wires `module.scheduler` and `module.ses` into the deployment. Preview `deploy/main.tf` is unchanged.

### Dummy Verification Schedule

A "daily greeting" schedule is included in the initial config to verify the full pipeline works end-to-end:
- **Config**: `schedules.json` entry with `cron(0 7 * * ? *)` in timezone `Europe/Zurich` (daily at 7am local time, DST-aware) targeting `POST /api/internal/reminders/batch`
- **Template**: `config/templates/greeting.mjml` — a simple responsive email with `{{userName}}` and `{{appUrl}}` variables, a CTA button linking to the recipes page, and an unsubscribe footer. `{{userName}}` uses a static placeholder (`"Breadly User"`) for all recipients in this iteration.
- **Payload**: `{ "type": "greeting", "userIds": ["..."] }` — the batch endpoint iterates the explicit list of user IDs, loads the template, and sends a personalized email to each

### Cost Impact

Effectively $0.00/month at expected volume. EventBridge Scheduler has a permanent free tier of 14M invocations/month (not 12-month limited). SES costs $0.10 per 1,000 emails. API Gateway HTTP API costs $1.00 per 1M requests. At ~130 schedule invocations/month and ~130 emails/month, all usage falls well within free tiers.

## Testing Decisions

### What makes a good test

Tests verify external behavior through public interfaces, not implementation details. A good test:
- Calls the public API of the module under test (service method, HTTP endpoint)
- Asserts on the observable outcome (return value, state change, outbound call to a dependency)
- Mocks only external boundaries (AWS SDKs, database, file system) — not internal functions
- Remains valid if the implementation is refactored without changing behavior

### Modules under test

| Module | Test Type | What to Test | Mocks |
|--------|-----------|-------------|-------|
| **Scheduler Service** | Unit (`scheduler.service.spec.ts`) | `createSchedule` creates correctly named EventBridge schedule with proper target config; `deleteSchedule` calls SDK with correct name; `listSchedules` parses prefix results and extracts payloads; naming convention enforcement; error propagation from SDK failures | `@aws-sdk/client-scheduler` (mock SDK client) |
| **Email Helper** | Unit (`email.helper.spec.ts`) | `loadTemplate` reads correct file path; `interpolate` replaces all `{{variables}}`; `interpolate` handles missing variables gracefully; `sendEmail` calls SES with correct parameters | `fs` (mock file reads), `@aws-sdk/client-ses` (mock SDK client) |
| **Reminder Service** | Unit (`reminder.service.spec.ts`) | `createReminder` calls scheduler service with correct naming and payload; `createReminder` rejects past `scheduledAt` dates; `createReminder` enforces per-user limit of 10; `listReminders` maps EventBridge results to Reminder DTOs; `cancelReminder` verifies ownership by parsing userId from schedule name before deleting; `cancelReminder` rejects with 403 if userId does not match; `sendReminder` loads template, interpolates, sends email; `processBatchReminders` iterates explicit userIds and sends per-user emails | Scheduler Service, Email Helper (mock both) |
| **Reminder Controller** | Integration (`reminder.controller.spec.ts`) | User-facing routes: POST creates reminder and returns 201; GET returns reminder list; DELETE returns 204; auth required (401 without token). Internal routes: POST /send triggers email; POST /batch triggers batch processing; no JWT required. Input validation on all routes. | Reminder Service (mock), use `supertest` against Express app with `makeToken()` for auth |

### Prior art

Existing test patterns in the codebase:
- `recipe.service.spec.ts` — unit tests with mocked database, same pattern for mocking scheduler/SES SDK
- `recipe.controller.spec.ts` — integration tests with `supertest` and `makeToken()`, same pattern for reminder controller
- `recipe.controller.http` — REST Client file for manual testing, same pattern for reminder endpoints

## Out of Scope

- **Frontend UI** for creating, listing, or canceling reminders — this PRD covers backend + infrastructure only. The frontend can be added incrementally later.
- **E2E tests** — no E2E coverage since there is no frontend component. E2E tests will be added when the frontend reminder UI is implemented.
- **MongoDB collection for reminders** — schedule data lives exclusively in EventBridge Scheduler. If query performance or rich metadata becomes a need, a MongoDB collection can be added later as an optimization.
- **Dead Letter Queue (DLQ)** — EventBridge retries up to 3 times, but failed events after all retries are dropped. A DLQ (SQS) can be added later if observability into failed schedules becomes important.
- **SES production access / domain verification** — the initial setup uses SES sandbox mode with a single verified sender email. Production access and DKIM/SPF domain verification are separate operational steps performed when ready to send to arbitrary recipients.
- **Preview environment support** — scheduler infrastructure is intentionally excluded from preview environments to avoid side effects.
- **Email unsubscribe / preference management** — users cannot opt out of specific email types in this iteration. This is a future feature.
- **Rich email content** (ingredient lists, recipe images in email) — the greeting template is intentionally simple. Richer templates can be added later using MJML's full component library.

## Further Notes

### MJML Template Variable Lifecycle

A common point of confusion: MJML compilation and variable interpolation are two entirely separate stages.

1. **Build time**: MJML compiles structural tags (`<mj-section>`, `<mj-text>`, etc.) into table-based HTML with inline styles. `{{variable}}` placeholders pass through untouched — MJML has no template engine and is blind to them.
2. **Send time** (runtime in Lambda): The `interpolate()` function replaces `{{variable}}` placeholders with user-specific values. This is when personalization happens.

This means templates are precompiled once during CI, but each email is personalized at the moment it is sent.

### EventBridge ListSchedules Tradeoffs

Using EventBridge `ListSchedules` as the sole data source for `GET /api/reminders` has known limitations:
- No indexing or sorting beyond the `NamePrefix` filter
- Pagination is cursor-based (not offset/page-based)
- ~200-500ms latency per API call
- Reminder metadata must be encoded in the schedule's target payload and parsed back out

These tradeoffs are acceptable at the expected low volume (< 100 concurrent reminders). If the feature grows significantly, the recommended migration path is to add a MongoDB `reminders` collection as the source of truth for UI queries while keeping EventBridge as the execution engine.

### Config File Consumed by Terraform

The `schedules.json` file lives in `breadly-backend/config/` but is consumed by Terraform via a cross-directory file reference (`../../breadly-backend/config/schedules.json`). This means changes to the schedule config require a `terraform apply` to take effect — they are not picked up at backend runtime. This is intentional: cron schedules are infrastructure, and their lifecycle is managed by Terraform.

### Security Model

The internal route security relies on two layers:
1. **API Gateway IAM auth**: Only AWS principals with `execute-api:Invoke` permission on the internal route can call it. The EventBridge Scheduler execution role is the only principal granted this permission.
2. **No JWT bypass risk**: Internal routes are registered on a separate path prefix (`/api/internal/*`) that is never exposed through JWT-authorized routes. A user with a valid JWT cannot call internal endpoints — API Gateway rejects the request because the IAM route requires SigV4 signatures, not Bearer tokens.
