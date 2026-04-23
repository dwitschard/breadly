# Custom Domain, DNS & SES Email Infrastructure

## Problem Statement

Breadly currently serves all environments (dev, prod, preview) via auto-generated CloudFront URLs (`*.cloudfront.net`). There is no custom domain, making URLs unbranded, hard to remember, and unprofessional. Email sending uses a personal iCloud email address (`floete-argon.8h@icloud.com`) verified as a single SES identity — this lacks proper authentication (DKIM, SPF, DMARC), cannot scale to production, and offers no per-environment tracking. There is no centralized, global infrastructure layer — DNS, certificates, and email identity are either missing or duplicated per environment.

## Solution

Introduce a **global infrastructure layer** (`infrastructure/aws/global/`) that provisions shared, cross-environment resources: a Route53 hosted zone, a wildcard ACM certificate, and a fully authenticated SES domain identity. Environment-specific Terraform roots (`deploy/`, `preview/gateway/`) consume these shared resources via SSM Parameter Store and configure custom domain aliases on their CloudFront distributions, Route53 DNS records, and environment-specific sender addresses.

The domain is registered manually in the AWS Console via Route53 (Route53 registration is required — the global Terraform module assumes the hosted zone is auto-created by Route53 domain registration). All other resources are managed via Terraform and deployed through a new `manage-global.yml` GitHub Actions workflow. The domain name is configurable via a GitHub repository-level variable (`DOMAIN_NAME`).

### Domain Mapping

All environments live under the `breadly.<domain>` subdomain. The root domain redirects to the production app.

| Environment | Domain |
|-------------|--------|
| Production | `breadly.<domain>` |
| Development | `dev.breadly.<domain>` |
| Preview | `preview.breadly.<domain>` (path-based per branch) |
| Cognito Auth (prod only) | `auth.<domain>` (at root domain level for cross-app token sharing) |
| Root redirect | `<domain>` → `https://breadly.<domain>` (301, path-preserving for all paths) |
| www redirect | `www.<domain>` and `www.breadly.<domain>` → `https://breadly.<domain>` (301, path-preserving) |

### Email Sending

| Aspect | Configuration |
|--------|---------------|
| Domain identity | `breadly.<domain>` (SES domain verification, covers subdomains) |
| DKIM | Easy DKIM, RSA 2048-bit |
| MAIL FROM | `email.breadly.<domain>` |
| SPF | `v=spf1 include:amazonses.com ~all` (on `email.breadly.<domain>`) |
| DMARC | `v=DMARC1; p=reject; rua=mailto:<rua_email>` (on `_dmarc.breadly.<domain>`) |
| Prod sender | `noreply@breadly.<domain>` |
| Dev sender | `noreply@dev.breadly.<domain>` |
| Config sets | `breadly-dev`, `breadly-prod` (no preview — preview does not send email) |

## User Stories

1. As a **user**, I want to access the production app at a branded custom domain, so that the URL is trustworthy and easy to remember.
2. As a **user**, I want `<domain>` to redirect (301) to `breadly.<domain>` with path preservation, so that the root domain leads to the app.
3. As a **developer**, I want to access the dev environment at `dev.breadly.<domain>`, so that I can distinguish it from production by URL.
4. As a **developer**, I want to access preview environments at `preview.breadly.<domain>/preview/<slug>/`, so that preview branches have branded URLs.
5. As a **user**, I want the production login page hosted at `auth.<domain>`, so that the authentication flow uses a root-level subdomain enabling cross-app token sharing.
6. As a **developer**, I want the domain name to be configurable via a single GitHub repository variable, so that it can be changed without modifying Terraform code.
7. As a **developer**, I want global infrastructure (DNS, certs, SES) managed in a dedicated Terraform root module, so that it is provisioned once and shared across all environments.
8. As a **developer**, I want environment-specific Terraform roots to consume global outputs via SSM parameters, so that there is no tight coupling between Terraform state backends.
9. As a **developer**, I want a single ACM certificate covering `breadly.<domain>`, `*.breadly.<domain>`, `<domain>`, `auth.<domain>`, and `www.<domain>`, so that all app subdomains, the Cognito auth domain, and redirect domains are covered with one certificate.
10. As a **developer**, I want the ACM certificate provisioned in `us-east-1` (CloudFront requirement) via an aliased Terraform provider, so that it works with CloudFront distributions in any region.
11. As an **email recipient**, I want emails from Breadly authenticated with DKIM (RSA 2048-bit), so that they are not marked as spam.
12. As an **email recipient**, I want a valid SPF record on the MAIL FROM domain, so that receiving mail servers can verify the sender.
13. As an **email recipient**, I want a DMARC policy of `p=reject` on the domain, so that spoofed emails are rejected.
14. As a **developer**, I want the DMARC `rua` reporting address configurable via a required GitHub variable, so that aggregate reports are always delivered.
15. As a **developer**, I want per-environment SES configuration sets (`breadly-dev`, `breadly-prod`), so that I can track email sending metrics per environment.
16. As a **developer**, I want the backend to pass `ConfigurationSetName` when sending emails via SES, so that sends are attributed to the correct configuration set.
17. As a **developer**, I want the SES sender email address to be environment-specific, so that recipients can identify the environment.
18. As a **developer**, I want Route53 A and AAAA alias records pointing each subdomain to its CloudFront distribution, so that DNS resolution works for both IPv4 and IPv6.
19. As a **developer**, I want Route53 A alias record pointing `auth.<domain>` to the Cognito-managed CloudFront distribution (prod only), so that the custom Cognito domain resolves correctly.
20. As a **developer**, I want a new `manage-global.yml` GitHub Actions workflow (manual dispatch), so that I can provision or update global infrastructure on demand.
21. As a **developer**, I want the global Terraform state stored in a dedicated `breadly-global-tfstate` S3 bucket with DynamoDB locking, so that it is isolated from environment state.
22. As a **developer**, I want the `manage-terraform.yml` bootstrap workflow to support a `global` environment option, so that the global state bucket can be created via the same process.
23. As a **developer**, I want the existing `modules/ses/` module deleted and its per-environment SES email identity removed from `deploy/`, so that SES is managed globally and not duplicated.
24. As a **developer**, I want `APP_URL` on backend Lambdas to use the custom domain URL, so that application-generated links use the branded domain.
25. As a **developer**, I want Cognito callback and logout URLs hard-cutover to custom domain URLs (no dual period with old CloudFront URLs), so that the OAuth flow works with the new domain.
26. As a **developer**, I want no frontend code changes required for the domain migration, so that the switch is transparent.
27. As a **user**, I want `www.<domain>` and `www.breadly.<domain>` to redirect (301) to `breadly.<domain>` with path preservation, so that common URL typos still reach the app.

## Implementation Decisions

### New Terraform Root: `global/`

- Single root module, no workspaces — applied once for all environments.
- Dual-region providers: `eu-central-1` (default, for SES/SSM) and `us-east-1` (aliased, for ACM). Backend Lambdas are also deployed in `eu-central-1`, ensuring SES API calls target the same region as the verified identity.
- Uses `data.aws_route53_zone` to look up the hosted zone auto-created by Route53 domain registration (domain must be registered via Route53 — this is a hard requirement).
- Creates ACM certificate with five SANs (`breadly.<domain>`, `*.breadly.<domain>`, `<domain>`, `auth.<domain>`, `www.<domain>`) in `us-east-1` with DNS validation via Route53 records.
- Creates SES domain identity with Easy DKIM (RSA 2048-bit), MAIL FROM domain (`email.breadly.<domain>`), and Route53 records for DKIM CNAMEs, MX, SPF TXT, and DMARC TXT. The identity is verified on `breadly.<domain>` and covers subdomains (e.g., `dev.breadly.<domain>`).
- Creates two SES configuration sets: `breadly-dev` and `breadly-prod`. No preview set.
- Creates an IAM policy granting `ses:SendEmail` and `ses:SendRawEmail` scoped to the domain identity ARN and configuration set ARNs.
- Publishes all outputs to SSM Parameter Store under `/breadly/global/` prefix.
- Creates an S3 bucket configured as a website redirect (`<domain>` → `https://breadly.<domain>`, path-preserving 301 for all paths) and a CloudFront distribution serving `<domain>`, `www.<domain>`, and `www.breadly.<domain>` as aliases, with the ACM cert. Route53 A+AAAA alias records point `<domain>`, `www.<domain>`, and `www.breadly.<domain>` to this distribution.
- Variables: `domain_name`, `app_subdomain` (default `breadly`), `dmarc_rua_email` (required — DMARC record always includes `rua`), `aws_region`, `aws_account_id`, `project_name`.

### Modified: CloudFront Module

- New variables: `domain_aliases` (list, default `[]`), `acm_certificate_arn` (string, default `""`).
- Conditional `viewer_certificate`: ACM cert with `sni-only` when aliases present, default CloudFront cert otherwise.
- New output: `cloudfront_hosted_zone_id` for Route53 alias records.

### Modified: Cognito Module

- New variables: `custom_domain` (string, default `""`), `certificate_arn` (string, default `""`).
- Conditional resource: custom domain with cert when set, prefix domain otherwise.
- New output: `cognito_cloudfront_domain` for Route53 alias record.
- When configured, the custom domain is `auth.<domain>` (root-level, not under `breadly.<domain>`) to enable cross-app token sharing.

### Modified: `deploy/`

- Removes `module.ses` and `ses_sender_email` variable entirely.
- Reads global outputs from SSM Parameter Store.
- Workspace-based domain mapping local: `prod` gets `breadly.<domain>`, `dev` gets `dev.breadly.<domain>`.
- Passes custom domain aliases and ACM cert ARN to CloudFront module.
- Creates Route53 A+AAAA alias records per domain alias.
- For prod workspace: configures Cognito custom domain `auth.<domain>` and creates its Route53 A alias record (A-only, no AAAA).
- Updates `local.cloudfront_url` and `local.frontend_urls` to use custom domain.
- Updates Lambda env vars: `SES_SENDER_EMAIL` (environment-specific), `SES_CONFIGURATION_SET`, `APP_URL` (`https://breadly.<domain>` for prod, `https://dev.breadly.<domain>` for dev).
- Replaces the existing per-environment SES IAM policy attachment with the global SES send policy ARN from SSM (clean swap, not additive).

### Modified: `preview/gateway/`

- Reads global outputs from SSM.
- Configures CloudFront alias `preview.breadly.<domain>`.
- Creates Route53 A+AAAA records.
- Changes `cloudfront_url` output to `https://preview.breadly.<domain>` so per-branch stacks auto-inherit the custom domain.
- Per-branch `APP_URL` is `https://preview.breadly.<domain>/preview/<slug>`.

### Deleted: SES Module

- `modules/ses/` is removed entirely. SES is now global.

### Backend Code

- Add optional `SES_CONFIGURATION_SET` environment variable to config.
- Add `ConfigurationSetName` to `SendEmailCommand` when the env var is set.

### CI/CD

- New `manage-global.yml` workflow: manual dispatch, terraform apply on `global/`.
- Update `manage-terraform.yml`: add `global` environment option for state bucket bootstrap.
- New GitHub repo-level variables: `DOMAIN_NAME`, `DMARC_RUA_EMAIL` (both required).

### Cognito Callback Migration

Cognito callback and logout URLs are hard-cutover to custom domain URLs. Old CloudFront URLs are not retained as additional allowed callbacks. Active sessions at the time of deployment will require re-authentication.

### What Does NOT Change

- **Frontend code**: redirect URIs derived from `document.baseURI`; Cognito config via `/api/public/config`.
- **Preview per-branch Terraform**: reads `cloudfront_url` from gateway remote state.
- **API Gateway CORS**: already uses `allow_origins = ["*"]`.
- **Cognito issuer URL**: remains `https://cognito-idp.<region>.amazonaws.com/<pool-id>`.

### Migration Execution Order

1. Register domain manually in AWS Console.
2. Set `DOMAIN_NAME` and `DMARC_RUA_EMAIL` as GitHub repo-level variables.
3. Bootstrap `breadly-global-tfstate` via `manage-terraform.yml`.
4. Run `manage-global.yml` — provisions all global resources.
5. Wait for both ACM cert validation and SES domain verification to complete before proceeding.
6. Deploy `preview/gateway` with custom domain.
7. Deploy `dev` environment.
8. Deploy `prod` environment.
9. Existing preview branches redeploy on next push.

## Testing Decisions

### What Makes a Good Test

Tests verify **external behavior** — what the function does, not how. Mock external dependencies (SES SDK) at the boundary. Assert on the shape of the SES command sent, not on internal state.

### Modules to Test

- **`email.helper.ts`** — unit test that `SendEmailCommand` includes `ConfigurationSetName` when env var is set, omits it when not set. Mock `SESClient.send()`.
- **`env.ts`** — verify `SES_CONFIGURATION_SET` is correctly parsed from environment variables.

### Prior Art

- Existing service unit tests in `breadly-backend/src/features/` mock dependencies and assert on external calls.

### What is NOT Tested

- Terraform modules — validated by `terraform plan`/`apply`.
- DNS propagation and ACM validation — verified manually.
- Frontend — no changes, no new tests.

## Out of Scope

- **Domain registration automation** — registration is a manual AWS Console step.
- **SES production access request** — manual AWS Support process. Infrastructure is production-ready but starts in sandbox mode.
- **SES inbound email** — no mailbox or email receiving capability.
- **Per-branch preview subdomains** — preview stays path-based.
- **Cognito custom domain for dev/preview** — only production gets `auth.<domain>`.
- **CDN cache invalidation changes** — existing logic unaffected.
- **SES monitoring/alerting** — configuration sets enable future tracking but no alarms are set up.
- **Preview URL path simplification** — preview stays at `/preview/<slug>/`; simplifying to `/<slug>/` is deferred to a future PRD.

## Further Notes

- **DMARC `p=reject`** is the strictest policy. Correct for a greenfield domain with no prior email history, but monitor after go-live.
- **SES sandbox**: only verified addresses can receive until sandbox exit is approved.
- **Cognito custom domain propagation**: AWS provisions a CloudFront distribution behind the scenes — can take up to 60 minutes.
- **Wildcard cert renewal**: auto-renews as long as DNS validation CNAME records remain in Route53 (Terraform manages these). The cert covers `breadly.<domain>`, `*.breadly.<domain>`, `<domain>`, `auth.<domain>`, and `www.<domain>`.
- **Rollback path**: reverting `deploy/` and `preview/gateway/` to previous state (CloudFront default certs, no aliases) restores old behavior. Global infrastructure can remain in place.
