# Global SES Domain, Cognito Custom Domains & Health Dashboard Fix

## Problem Statement

The Breadly infrastructure has several issues that need to be addressed together:

1. **SES email domain is app-specific.** The current SES domain identity is `breadly.appdock.ch` with MAIL FROM `email.breadly.appdock.ch`. This prevents sharing email infrastructure across multiple apps under `appdock.ch`. The sender address `noreply@dev.breadly.appdock.ch` is unnecessarily long and app-scoped.

2. **Cognito lacks custom domains for non-prod environments.** Only production has a custom Cognito domain (`auth.appdock.ch`). Dev uses an Amazon prefix domain (`breadly-dev.auth.eu-central-1.amazoncognito.com`) and each preview branch creates its own throwaway Cognito pool with its own prefix domain. This is inconsistent, wasteful, and makes the login experience unprofessional in non-prod environments.

3. **No verified SES recipient for testing.** In SES sandbox mode, both sender and recipient must be verified. There is no verified recipient email identity, making it impossible to test email sending without manual AWS Console intervention.

4. **Health dashboard does not display API response time.** The Systemstatus page shows green/red status dots for API and database checks, but the response time is always blank. The backend returns `responseTime: undefined` for both checks, and the frontend renders an empty string. The UI has the slot for it but no data flows through.

## Solution

### SES Domain Migration

Move the SES domain identity from `breadly.appdock.ch` to `appdock.ch`. This changes:

| Aspect | Before | After |
|--------|--------|-------|
| Domain identity | `breadly.appdock.ch` | `appdock.ch` |
| MAIL FROM | `email.breadly.appdock.ch` | `email.appdock.ch` |
| DKIM | `*._domainkey.breadly.appdock.ch` | `*._domainkey.appdock.ch` |
| SPF | on `email.breadly.appdock.ch` | on `email.appdock.ch` |
| DMARC | `_dmarc.breadly.appdock.ch` | `_dmarc.appdock.ch` |
| Dev sender | `noreply@dev.breadly.appdock.ch` | `noreply@dev.appdock.ch` |
| Prod sender | `noreply@breadly.appdock.ch` | `noreply@appdock.ch` |
| Preview sender | (none) | `noreply@preview.appdock.ch` |

This is a destructive replace-in-place: Terraform destroys the old identity and creates the new one. Acceptable because email sending is not yet production-critical.

### Cognito Custom Domains for All Environments

Give every environment a custom Cognito domain:

| Environment | Before | After |
|-------------|--------|-------|
| Production | `auth.appdock.ch` | `auth.appdock.ch` (unchanged) |
| Development | `breadly-dev.auth.eu-central-1.amazoncognito.com` | `dev.auth.appdock.ch` |
| Preview | Per-branch Amazon prefix domains | `preview.auth.appdock.ch` (shared pool) |

Preview branches currently each create their own Cognito user pool. This changes to a single shared preview pool created in `preview/gateway/` (alongside the shared API Gateway and CloudFront). All preview branches share this pool and its users. The pool uses a wildcard callback URL pattern to cover any branch path.

The ACM certificate SANs are extended to include `dev.auth.appdock.ch` and `preview.auth.appdock.ch`.

### SES Email Identity for Testing

Add `floete-argon.8h@icloud.com` as a verified SES email identity in the global Terraform module. After `terraform apply`, AWS sends a verification email to that address which must be clicked to complete verification.

### Health Dashboard Response Time

Measure the API round-trip time in the frontend health feature service by wrapping the `getHealth()` observable with timing logic (`performance.now()` before and after). Expose the result as a readonly signal (`apiResponseTime`). The container passes it to the dumb dashboard component, which displays it in the existing API check row (e.g., `142ms`). The database check responseTime span is removed from the UI since no backend timing is measured.

## User Stories

1. As a **developer**, I want the SES domain identity on `appdock.ch` (not `breadly.appdock.ch`), so that email infrastructure can be shared across all apps under the domain.
2. As a **developer**, I want the MAIL FROM domain to be `email.appdock.ch`, so that email authentication records are at the root domain level.
3. As a **developer**, I want DKIM, SPF, and DMARC DNS records on `appdock.ch`, so that emails from any app subdomain are properly authenticated.
4. As a **developer**, I want the dev sender email to be `noreply@dev.appdock.ch`, so that it is shorter and environment-identifiable without being app-scoped.
5. As a **developer**, I want the prod sender email to be `noreply@appdock.ch`, so that production emails come from a clean, professional address.
6. As a **developer**, I want the preview sender email to be `noreply@preview.appdock.ch`, so that preview environment emails are distinguishable.
7. As a **developer**, I want `floete-argon.8h@icloud.com` added as a verified SES email identity, so that I can test email sending in SES sandbox mode without manual Console steps.
8. As a **developer**, I want the dev Cognito pool to use `dev.auth.appdock.ch` as its custom domain, so that the dev login experience uses a branded, consistent URL.
9. As a **developer**, I want the preview Cognito pool to use `preview.auth.appdock.ch` as its custom domain, so that preview login is branded and consistent.
10. As a **developer**, I want a single shared Cognito pool for all preview branches, so that preview users persist across branch deployments and custom domains are possible (AWS allows one custom domain per pool).
11. As a **developer**, I want the shared preview Cognito pool to use wildcard callback URLs, so that any preview branch path is automatically covered without updating the pool.
12. As a **developer**, I want the preview Cognito pool created in `preview/gateway/` (not per-branch), so that it is provisioned once alongside the shared API Gateway and CloudFront.
13. As a **developer**, I want per-branch preview deploys to read Cognito outputs from the gateway remote state, so that they no longer create and destroy their own pools.
14. As a **developer**, I want the ACM certificate to include `dev.auth.appdock.ch` and `preview.auth.appdock.ch` as SANs, so that Cognito custom domains can use the same certificate.
15. As a **developer**, I want DNS A records for `dev.auth.appdock.ch`, `preview.auth.appdock.ch`, and `auth.appdock.ch` pointing to their respective Cognito CloudFront distributions, so that the custom domains resolve correctly.
16. As an **admin user**, I want the health dashboard to show the API round-trip time (e.g., `142ms`), so that I can assess API latency at a glance.
17. As an **admin user**, I want the health dashboard to show only relevant timing information, so that empty/meaningless values do not clutter the UI.
18. As a **developer**, I want the API response time measured in the frontend feature service, so that the timing captures the full round-trip including network latency.
19. As a **developer**, I want the response time exposed as a signal from the health feature service, so that it integrates cleanly with the signals-first architecture.
20. As a **developer**, I want the response time to reset on reload, so that stale values are not displayed during a refresh.

## Implementation Decisions

### Infrastructure: SES Domain Migration

- Change `local.email_domain` from `email.${local.app_domain}` to `email.${var.domain_name}` in `global/main.tf`.
- Change `local.dmarc_domain` from `_dmarc.${local.app_domain}` to `_dmarc.${var.domain_name}`.
- Change the SES domain identity resource domain from `local.app_domain` to `var.domain_name`.
- Update all SES-related DNS record names to use `var.domain_name` instead of `local.app_domain`.
- This is a destructive replace-in-place. No two-phase migration.

### Infrastructure: SES Sender Email

- Change `local.ses_sender_email` in `deploy/main.tf` from `noreply@${local.env_domain}` to `noreply@${terraform.workspace == "prod" ? local.domain_name : "${terraform.workspace}.${local.domain_name}"}`.
- Dev resolves to `noreply@dev.appdock.ch`, prod to `noreply@appdock.ch`.
- Preview sender (when applicable) uses `noreply@preview.appdock.ch`.

### Infrastructure: SES Email Identity

- Add an `aws_ses_email_identity` resource in `global/main.tf` for `floete-argon.8h@icloud.com`.
- After apply, the email owner must click the verification link.

### Infrastructure: ACM Certificate

- Add `dev.auth.appdock.ch` and `preview.auth.appdock.ch` to the `certificate_sans` list in `global/main.tf`.
- This triggers a certificate replacement. The existing `create_before_destroy` lifecycle handles this safely, but DNS validation records must be created for the new SANs.

### Infrastructure: Cognito Custom Domain for Dev

- Change `local.cognito_custom_domain` in `deploy/main.tf` from prod-only to workspace-specific: `dev.auth.appdock.ch` for dev, `auth.appdock.ch` for prod.
- Change `local.cognito_certificate_arn` to always use the certificate ARN (remove the empty-string fallback for dev).
- Change the Cognito DNS A record from `count = prod ? 1 : 0` to always-create, using the workspace-specific auth domain.

### Infrastructure: Shared Preview Cognito

- Add a `module "cognito"` in `preview/gateway/main.tf` with:
  - Name: `<project>-preview`
  - Custom domain: `preview.auth.<domain>`
  - Admin password auth enabled (for E2E tests)
  - Wildcard callback URL covering all branch paths
- Add DNS A record for `preview.auth.<domain>` in `preview/gateway/main.tf`.
- Add outputs for Cognito issuer URL, client ID, hosted UI domain, and user pool ID.
- Remove `module "cognito"` from `preview/deploy/main.tf`.
- Update all Cognito references in `preview/deploy/main.tf` to read from the gateway remote state.
- The Cognito module's callback URL logic must handle wildcard patterns (the module currently splits on comma and appends `/oidc-callback` — this needs to work correctly with wildcard `*` in paths).

### Frontend: Health Response Time Measurement

- In the health feature service, wrap the `getHealth()` observable with timing logic using `performance.now()`.
- Expose `apiResponseTime` as a `ReadonlySignal<string | undefined>` (formatted as `'XXms'`).
- Reset the signal to `undefined` when `reload()` is called.
- In the container, pass `healthService.apiResponseTime()` to the dashboard component.
- In the dashboard component, add an `apiResponseTime` input (optional string) and display it in the API check row.
- Remove the `health-check-db-time` span from the dashboard template.
- Remove the backend's `responseTime` field rendering from the API check (use the new input instead).

### Deployment Order

1. Apply `global/` — SES migration, ACM cert update, email identity.
2. Wait for ACM certificate DNS validation.
3. Apply `preview/gateway/` — shared preview Cognito pool.
4. Apply `deploy/` dev workspace — dev Cognito custom domain, updated SES sender.
5. Apply `deploy/` prod workspace — updated SES sender (Cognito already has custom domain).
6. Apply `preview/deploy/` (per-branch) — remove per-branch Cognito, use shared pool.
7. Deploy frontend — health dashboard fix (independent, can run in parallel).

## Testing Decisions

### What Makes a Good Test

Tests verify **external behavior** from the consumer's perspective. Component tests assert on what the user sees (rendered output, interaction results) using Testing Library queries. Service tests mock HTTP boundaries and assert on signal values. No internal state inspection, no `fixture.componentInstance` access.

### Modules to Test

1. **Health feature service** (`health.service.ts`) — test that `apiResponseTime` signal is populated after a successful health API call and contains a value matching the `XXms` format. Test that it resets to `undefined` on `reload()`. Mock the generated API service's HTTP call using `HttpTestingController`.

2. **Health dashboard component** (`health-dashboard.component.ts`) — test that when `apiResponseTime` is provided, it renders in the API check row. Test that when it is `undefined`, the time span is empty. Test that no DB time span exists in the DOM. Use `renderWithProviders` with `componentInputs`.

3. **Health container** (`health.container.ts`) — test that `apiResponseTime` from the fake service is passed through to the rendered dashboard. Use `componentProviders` to inject a fake health service with controllable signals.

### Prior Art

- Existing health dashboard component tests in `health-dashboard.component.spec.ts` follow the ATL pattern with `renderWithProviders` and `componentInputs`.
- Existing health container tests in `health.container.spec.ts` use fake services with signal-based mocks.

### What is NOT Tested

- **Terraform modules** — validated by `terraform plan` / `terraform apply`.
- **DNS propagation, ACM validation, SES verification** — verified manually after apply.
- **Cognito custom domain setup** — verified manually (AWS provisions a CloudFront distribution behind the scenes, can take up to 60 minutes).

## Out of Scope

- **SES production access request** — manual AWS Support process, not part of this change.
- **SES inbound email** — no mailbox or receiving capability.
- **Backend response time measurement** — the backend does not measure DB ping time; only the frontend measures API round-trip.
- **Multiple verified test recipients** — only `floete-argon.8h@icloud.com` is added; additional recipients can be added later.
- **Cognito SES integration** — Cognito continues to use `COGNITO_DEFAULT` email (Amazon's built-in sender) for verification codes. Switching Cognito to use SES for email delivery is a separate concern.
- **Preview email sending** — preview environments do not currently send emails; the `noreply@preview.appdock.ch` sender is defined for future use.
- **Per-branch preview subdomains** — preview stays path-based under `preview.breadly.appdock.ch`.

## Further Notes

- **SES sandbox mode**: Even after domain verification, only verified recipient addresses can receive emails until sandbox exit is approved. The `floete-argon.8h@icloud.com` identity enables immediate testing.
- **Cognito custom domain propagation**: AWS provisions a CloudFront distribution behind each custom domain. This can take up to 60 minutes per domain. Plan for this delay during deployment.
- **ACM certificate replacement**: Changing SANs forces a new certificate. With `create_before_destroy`, the new cert is provisioned before the old one is destroyed. All existing services (CloudFront distributions, Cognito domains) will need to be updated to reference the new cert ARN, which Terraform handles automatically.
- **Shared preview Cognito pool**: Existing per-branch Cognito pools will be destroyed when their branch stacks are next updated or torn down. The shared pool must be created first (step 3 in deployment order) before any per-branch stack removes its local pool.
- **Wildcard callback URLs in Cognito**: AWS Cognito supports `*` wildcards in callback URLs. The pattern `https://preview.breadly.appdock.ch/preview/*/oidc-callback` covers all branch slugs. This is slightly less secure than exact URLs but acceptable for preview environments.
- **Rollback path**: SES can be reverted by changing the domain back to `local.app_domain`. Cognito custom domains can be removed by setting `custom_domain = ""` (reverts to Amazon prefix domain). The health dashboard fix is a pure frontend change with no infrastructure dependency.
