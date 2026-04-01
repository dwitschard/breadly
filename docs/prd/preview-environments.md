# PRD: Feature Branch Preview Environments

## Problem Statement

Developers working on Breadly have no way to deploy and test feature branches in a production-like AWS environment before merging to main. All testing happens locally, which means:

- Reviewers cannot see a running version of a feature branch without checking it out and running it locally.
- Integration issues between frontend and backend are only caught after merging to main and deploying to dev.
- Auth flows (Cognito OIDC) cannot be tested end-to-end without deploying to dev.
- There is no way to share a running preview with stakeholders (PMs, designers) for early feedback.
- The dev environment is the first place any code runs in AWS, making it a fragile, high-contention resource.

## Solution

Automatically deploy a full, isolated preview environment for every feature branch pushed to the repository. Each preview environment runs the complete stack (frontend, backend, authentication, database) under a unique URL path on the existing dev CloudFront distribution. When a branch is deleted, all its preview resources are automatically torn down.

The preview URL pattern is:

```
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/
```

Where `<branch-slug>` is the branch name slugified (lowercase, special characters replaced with `-`, truncated to 40 characters). The branch name is immediately visible in the URL, making it clear which version is running.

Each preview environment includes pre-provisioned demo users with known credentials and seed data, so reviewers can log in and test immediately without any setup.

## User Stories

1. As a developer, I want every push to my feature branch to automatically deploy a preview environment, so that I can test my changes in a production-like AWS setup without manual intervention.

2. As a developer, I want the preview deployment to complete in under 7 minutes, so that I don't lose focus waiting for feedback on my changes.

3. As a developer, I want the preview URL to contain my branch name (e.g., `/preview/feature-recipe-search/`), so that I can immediately identify which branch a preview corresponds to.

4. As a developer, I want a comment automatically posted on my pull request with the preview URL and demo credentials, so that I can share the preview with reviewers without explaining how to find it.

5. As a code reviewer, I want to click a link in the PR comment and see the running feature branch, so that I can review behavior alongside the code diff.

6. As a code reviewer, I want pre-provisioned demo users (demo and admin) with known credentials, so that I can log in and test auth-protected features immediately.

7. As a code reviewer, I want the preview environment to contain seed data, so that I see a realistic application state without manually creating test data.

8. As a developer, I want preview infrastructure to be automatically torn down when I delete my branch, so that I don't have to remember to clean up resources manually.

9. As a developer, I want the latest push to my branch to cancel any in-progress deployment for the same branch, so that I always see the most recent version without waiting for stale deployments.

10. As a team lead, I want a maximum of 5 concurrent preview environments enforced, so that AWS resource usage stays bounded and predictable.

11. As a developer, I want each preview environment to have its own Cognito User Pool, so that auth changes in one branch don't affect other branches or the dev environment.

12. As a developer, I want each preview environment to use its own MongoDB database (on the shared Atlas cluster), so that data changes in one branch don't corrupt another branch's state.

13. As a developer, I want the preview deployment to build and run both frontend and backend on every push, so that I always have a consistent full-stack preview regardless of which parts I changed.

14. As a developer, I want to manage seed data as JSON files in the repository (`breadly-backend/seed-data/`), so that I can edit preview test data locally and commit it alongside my feature code.

15. As a developer, I want the seed script to skip seeding if data already exists, so that repeated pushes to the same branch don't create duplicate records.

16. As a developer, I want the main branch (`main`) to be excluded from preview deployments, so that the existing dev/prod deployment pipelines are not affected.

17. As a developer, I want the preview environment to share the same CloudFront distribution as dev, so that deployments are fast (no 15-25 minute CloudFront creation wait).

18. As a developer, I want demo user passwords stored as GitHub environment secrets (not in code), so that credentials are not exposed in the repository.

19. As a developer, I want the preview environment to work with Angular's client-side routing, so that deep links and page refreshes work correctly under the `/preview/<slug>/` path prefix.

20. As a developer, I want the preview system to be completely independent of the dev environment's GitHub protection rules, so that preview deployments don't require manual approval.

21. As a developer, I want the cleanup process to fully remove all branch-specific AWS resources (Cognito, Lambdas, IAM roles, API Gateway routes, authorizer, DynamoDB tables) via a single `terraform destroy`, so that no orphaned resources accumulate.

22. As a developer, I want to see the preview deployment status (success, failure, URL) directly in the PR without navigating to the GitHub Actions run, so that I get fast feedback.

## Implementation Decisions

### Architecture: Shared Infrastructure with Path-Prefix Routing

The preview system shares the existing dev CloudFront distribution, S3 bucket, and API Gateway. This avoids CloudFront creation (15-25 minutes) on every branch deploy. Each branch gets its own Lambdas, Cognito User Pool, API Gateway routes, and JWT authorizer as per-branch resources.

**Shared resources (zero marginal cost per branch):**
- CloudFront distribution (existing dev)
- S3 bucket (existing `breadly-dev-frontend`, branches use prefixes `preview/<slug>/`)
- API Gateway HTTP API (existing dev, branches add routes)
- MongoDB Atlas cluster (existing dev, branches use database `breadlydb-preview-<slug>`)
- Terraform state backend (existing `breadly-dev-tfstate` S3 bucket)

**Per-branch resources (created/destroyed with branch):**
- 2 Lambda functions (private + public)
- 2 IAM roles + policies
- 1 Cognito User Pool + App Client + Hosted UI domain
- 1 JWT Authorizer on the shared API Gateway
- 2 API Gateway routes (private + public) + 2 integrations + 2 Lambda permissions
- S3 objects under `preview/<slug>/` prefix
- 2 demo users (demo + admin)
- MongoDB database (cleanup planned, not yet implemented; DynamoDB tables will be Terraform-managed and auto-destroyed)

**Cost per branch at rest: ~$0.001/month.** All compute is serverless and pay-per-request. Cognito is free under 50K MAU.

### URL Pattern and Branch Slugification

- Frontend: `https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/`
- Backend API: `https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/api/*`
- Slugification: lowercase, replace `/`, `_`, `.`, `+` with `-`, strip leading/trailing `-`, truncate to 40 characters.
- Example: `feature/recipe-search` becomes `feature-recipe-search`.

### CloudFront Function Enhancement

The existing CloudFront Function (`strip-api-prefix`) is enhanced to handle preview routing:

1. `/preview/<slug>/api/*` requests: strip the `/api` segment, forward to API Gateway as `/preview/<slug>/*`.
2. `/preview/<slug>/<file-with-extension>` requests: pass through to S3 (CSS, JS, images).
3. `/preview/<slug>/<non-asset-path>` requests: rewrite to `/preview/<slug>/index.html` (Angular SPA client-side routing support).
4. Existing `/api/*` and `/*` routing: unchanged.

This approach handles SPA routing per preview prefix without relying on CloudFront's global custom error responses (which would return the root `index.html` instead of the preview-specific one).

### Express Preview Middleware

The backend Express app receives requests with the preview prefix in the path (e.g., `/preview/feature-recipe-search/recipes`). A middleware at the top of the middleware chain detects the `/preview/<slug>/` prefix and strips it, so all existing route handlers work without modification.

### API Gateway Routing

Each branch creates static routes on the shared API Gateway:
- `ANY /preview/<slug>/{proxy+}` pointing to the branch's private Lambda (JWT-protected by the branch's authorizer).
- `ANY /preview/<slug>/public/{proxy+}` pointing to the branch's public Lambda (unauthenticated).

The route limit (300 per API Gateway) is not a concern: 5 branches x 2 routes + dev's 2 routes = 12 routes.

### Per-Branch Cognito with Demo Users

Each preview branch gets its own Cognito User Pool, App Client, and Hosted UI domain. This provides:
- Full auth isolation between branches.
- No shared callback URL management (each branch's Cognito has only its own callback URL).
- No race conditions on concurrent deployments updating the same Cognito resource.
- Clean teardown (entire User Pool destroyed with `terraform destroy`).

Two demo users are created per branch via AWS CLI (not Terraform, to avoid storing passwords in Terraform state):
- `demo@breadly.app` with password from `PREVIEW_DEMO_PASSWORD` GitHub secret.
- `admin@breadly.app` with password from `PREVIEW_ADMIN_PASSWORD` GitHub secret.

Users are created with `admin-create-user` + `admin-set-user-password --permanent` to skip email verification and force-change flows.

The frontend automatically uses the correct Cognito configuration because the `/api/public/config` endpoint returns the branch-specific Cognito issuer and client ID from the public Lambda's environment variables.

### Angular Base Href and Config Service

- Angular is built with `ng build --base-href /preview/<slug>/` so that assets, routes, and links resolve correctly under the preview prefix.
- The config service URL is changed from absolute (`'/api/public/config'`) to relative (`'api/public/config'`) so it resolves relative to the base href.

### JWT Authorizer Limit

API Gateway supports a maximum of 10 authorizers per API. With 1 for dev and 1 per preview branch, the preview limit is set to 5 (6 total authorizers, safely under 10).

### Terraform State Management

- A new Terraform root module manages all per-branch resources.
- Each branch gets a Terraform workspace named `preview-<slug>` within this module.
- State is stored in the existing dev state bucket (`breadly-dev-tfstate`).
- The preview module reads shared resource IDs (API Gateway ID, Cognito issuer URL) from the dev backend state via `terraform_remote_state`.
- Two missing outputs must be added to the backend root module: `api_gateway_id` and `cognito_issuer_url`.

### GitHub Actions Architecture

**New GitHub environment:** `preview`
- Secrets: `MONGODB_URI` (same as dev), `PREVIEW_DEMO_PASSWORD`, `PREVIEW_ADMIN_PASSWORD`.
- Decoupled from dev environment protection rules.

**Deploy workflow:**
- Trigger: push to any branch except `main`.
- Concurrency: `preview-${{ github.ref_name }}` with `cancel-in-progress: true`.
- Steps: slugify, check limit (fail if >= 5 workspaces), build frontend + backend in parallel, terraform apply, S3 sync, create demo users, seed data (placeholder), PR comment.

**Cleanup workflow:**
- Trigger: `delete` event (ref_type: branch).
- Steps: terraform destroy (removes all per-branch resources including future DynamoDB tables), S3 prefix deletion, workspace deletion.

### Seed Data System

- Seed data is stored as JSON files in `breadly-backend/seed-data/` (one file per entity, e.g., `recipes.json`).
- Each file contains an array of objects matching the corresponding API Create DTO.
- The seed script authenticates via Cognito `admin-initiate-auth`, checks if data already exists (skips if non-empty), and POSTs each object to the API.
- Seeding via API calls (not direct DB access) makes the system database-agnostic, surviving the planned MongoDB-to-DynamoDB migration without changes.
- The seed script is a placeholder for now; logic to be implemented later.

### DynamoDB Migration Alignment

- When DynamoDB tables are added to the preview Terraform module, `terraform destroy` automatically deletes them. No separate database cleanup step is needed.
- The seed script calls the API (not the database), so the DynamoDB migration does not affect seeding.

### Resource Naming Convention

All preview resources follow the pattern `breadly-preview-<slug>-*`, consistent with the existing `breadly-<env>-*` convention.

## Testing Decisions

Tests should validate external behavior (inputs and outputs) rather than implementation details. A good test asserts "given this request path, the middleware produces this transformed path" rather than "the regex on line 5 matches correctly."

### Modules with Automated Tests

**Express preview middleware:**
- Unit/integration tests using supertest against the Express app.
- Test cases: requests with `/preview/<slug>/recipes` are routed to the recipe controller; requests without the prefix work as before; edge cases (double slashes, missing slug, `/preview/` alone).
- Prior art: existing controller integration tests in `breadly-backend/src/features/*/` use supertest with the Express app.

**CloudFront Function:**
- Test using CloudFront Function test events (AWS-provided JSON test event format for `cloudfront-js-2.0`).
- Test cases: `/preview/<slug>/api/recipes` rewrites correctly; `/preview/<slug>/styles.css` passes through; `/preview/<slug>/some-route` rewrites to `index.html`; existing `/api/*` and `/*` behavior unchanged.
- Prior art: no existing CF Function tests; will establish the pattern.

**Branch slugification:**
- Unit test for the slug function.
- Test cases: `feature/recipe-search` becomes `feature-recipe-search`; special characters handled; truncation at 40 chars; leading/trailing dashes stripped.
- Prior art: none; simple pure-function test.

### Modules Without Automated Tests

- **Terraform modules**: Validated by `terraform plan` during CI. No IaC testing framework used.
- **GitHub Actions workflows**: Validated by running on a test branch. No workflow unit testing framework.
- **Seed script**: Placeholder; will be tested when logic is implemented.

## Out of Scope

- **Custom domain / DNS**: The preview system uses default CloudFront domains. Custom domains (e.g., `preview-<slug>.breadly.dev`) are not part of this feature.
- **Production preview environments**: Previews only deploy to the dev AWS account using dev-tier resources. No staging or production preview support.
- **Seed script logic implementation**: The seed script is a placeholder. Actual seed data insertion logic will be implemented separately.
- **MongoDB-to-DynamoDB migration**: The preview system is designed to support DynamoDB, but the migration itself is a separate effort.
- **Scheduled cleanup / TTL-based expiry**: Preview environments are only cleaned up on branch deletion. There is no scheduled job to remove stale previews.
- **Branch protection or approval gates for previews**: Any non-main branch triggers a preview. No label, PR, or approval requirement.
- **Monitoring / alerting for preview environments**: No CloudWatch alarms, dashboards, or health checks for previews.
- **Cost alerting**: No AWS Budget or billing alerts specific to preview environments.
- **Multiple AWS accounts**: Previews run in the same AWS account as dev. Cross-account deployment is not supported.

## Further Notes

- **API Gateway authorizer limit**: The 10-authorizer-per-API limit is a hard AWS quota. If more than 5 concurrent previews are needed in the future, options include: requesting a quota increase from AWS, switching to app-level auth (validating JWTs in Express middleware instead of the API Gateway authorizer), or using a shared Cognito pool with dynamic callback URL management.
- **CloudFront Function code size**: CloudFront Functions have a 10 KB code size limit. The current function is ~150 bytes; the enhanced version is estimated at ~1-2 KB, well within the limit.
- **Cognito Hosted UI domain uniqueness**: The domain prefix (e.g., `breadly-preview-feature-recipe-search-backend`) must be globally unique across all AWS accounts. If a collision occurs, the Terraform apply will fail with a clear error.
- **Relative config URL change**: Changing the config service URL from `'/api/public/config'` to `'api/public/config'` also affects dev and production environments. This is safe because the `<base href>` for dev/prod is `/`, and a relative URL resolves to `/api/public/config` from base `/`. No behavior change for existing environments.
- **Preview limit enforcement relies on Terraform workspace listing**: If a cleanup workflow fails (e.g., GitHub Actions outage during branch deletion), orphaned workspaces could count toward the limit. Manual cleanup via `terraform workspace delete` resolves this.
