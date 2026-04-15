# GitHub Actions — Workflows

## `ci-backend.yml`

Lints, tests, packages and produces a release artifact for the Express backend.
On push to `main`, automatically triggers `_deploy.yml` to deploy to `dev`.

---

## `ci-frontend.yml`

Lints, tests, and produces a production build artifact for the Angular frontend.
On push to `main`, automatically triggers `_deploy.yml` to deploy to `dev`.

### What it does

1. `npm ci`
2. `npm run lint` (Prettier)
3. `npm run test:ci` (Vitest, no-watch)
4. `npm run build` (generates API client, then `ng build`)
5. Uploads `dist/breadly-frontend/browser/` as artifact `frontend-dist` (retained 1 day)

---

## `_deploy.yml`

Unified deployment workflow for the merged dev/prod root module (`infrastructure/aws/deploy/`).
Deploys frontend (S3), backend (Lambda), Cognito, API Gateway, and CloudFront in a single Terraform apply.

### Triggers

| Trigger | Target environment |
|---|---|
| Called by `ci-backend.yml` on push to `main` | `dev` (automatic) |
| Called by `ci-frontend.yml` on push to `main` | `dev` (automatic) |
| `workflow_dispatch` → select backend/frontend release tags + environment | chosen environment (manual) |

Production is **never deployed automatically**. Use the GitHub Actions UI "Run workflow" button and select `prod`.

### How it works

1. Downloads both artifacts: the caller's `release_tag` directly, and the other component's latest matching release
2. Runs `terraform-setup` + `terraform-action` against `infrastructure/aws/deploy/`
3. All resources (S3, Cognito, Lambda x2, API Gateway, CloudFront) are applied in a single plan

### Required GitHub Secrets and Variables

Navigate to **Settings → Secrets and variables → Actions → Environments** and configure each environment (`dev`, `prod`) with the following:

#### Secrets (encrypted — not visible in logs)

| Secret | Scope | Description | Example |
|---|---|---|---|
| `AWS_OIDC_ROLE_ARN` | Repository | ARN of the IAM role the runner assumes via OIDC. | `arn:aws:iam::123456789012:role/breadly-github-deploy` |
| `AWS_ACCOUNT_ID` | Repository | 12-digit AWS account ID. Used by the Terraform provider as a deployment guard. | `123456789012` |
| `MONGODB_URI` | Environment | MongoDB connection string for this stage. Injected as `MONGODB_CONNECTION_STRING` env var on the private Lambda. | `mongodb+srv://user:pass@cluster.mongodb.net/breadly` |

#### Variables (plaintext — visible in logs)

| Variable | Scope | Description | Example |
|---|---|---|---|
| `AWS_REGION` | Repository | AWS region for all resources and the Terraform state bucket. | `eu-central-1` |

> `MONGODB_URI` must be set **per environment** (dev and prod each have their own value).
> `AWS_OIDC_ROLE_ARN` and `AWS_ACCOUNT_ID`
> can be repository-level secrets if dev and prod share the same AWS account.
>
> The frontend URL for Cognito callback/logout configuration is derived automatically
> from the CloudFront domain within the merged root module. For the `dev` workspace,
> `http://localhost:4200` is also included as a valid callback URL.

---

## `preview.yml`

Deploys a full-stack preview environment for every non-main branch push.
Each preview runs under `/preview/<branch-slug>/` on the dedicated preview CloudFront distribution.
Runs E2E tests against the deployed preview and posts results to the PR.

### Triggers

| Trigger | Target |
|---|---|
| Push to any non-`main` branch | Preview environment |

### Jobs

```
slugify ──────┐
build-backend ┼──▶ _deploy-preview.yml ──▶ _run-e2e.yml
build-frontend┘
```

### What it does

1. Delegates to `_deploy-preview.yml` (see below) for deployment
2. Delegates to `_run-e2e.yml` for E2E testing with PR comment posting enabled

### Preview URLs

```
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/        # Frontend
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/api/*   # Backend
```

---

## `e2e-main.yml`

Runs E2E tests on the main branch after every push. Deploys a temporary preview environment with a fixed slug (`e2e-main`), runs the Playwright E2E suite against it, and tears it down afterward.

### Triggers

| Trigger | Target |
|---|---|
| Push to `main` | Temporary `e2e-main` preview environment |

### Jobs

```
build-backend ──┐
build-frontend ─┼──▶ _deploy-preview.yml ──▶ _run-e2e.yml ──▶ _teardown-preview.yml (always)
```

---

## `_run-e2e.yml`

Reusable workflow (`workflow_call`) that runs Playwright E2E tests against a deployed preview environment. Shared by `preview.yml` and `e2e-main.yml` to avoid duplication of E2E setup, execution, and reporting logic.

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `slug` | Yes | — | Branch slug for artifact naming |
| `preview_url` | Yes | — | Full URL of the deployed preview environment |
| `cognito_client_id` | Yes | — | Cognito User Pool Client ID for E2E auth |
| `post-to-pr` | No | `false` | Whether to post E2E results as a PR comment |
| `branch-name` | No | `""` | Git branch name for PR lookup |

### What it does

1. Sets up Playwright (Node, npm deps, Chromium) via `setup-playwright` action
2. Runs `npx playwright test` against the preview URL
3. Uploads HTML report artifact and writes job summary via `playwright-report` action
4. Optionally posts/updates a PR comment with E2E results

---

## `_deploy-preview.yml`

Reusable workflow (`workflow_call`) that deploys a full preview stack for a given branch slug. Shared by `preview.yml` and `e2e-main.yml` to avoid duplication.

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `slug` | Yes | — | URL-safe branch slug for workspace and S3 prefix |
| `post-pr-comment` | No | `false` | Whether to post preview URL as a PR comment |
| `branch-name` | No | `""` | Git branch name for PR lookup |

### Outputs

| Output | Description |
|---|---|
| `preview_url` | Full URL to the deployed preview |
| `cognito_client_id` | Cognito User Pool Client ID for E2E auth |

### What it does

1. Downloads backend + frontend build artifacts
2. Deploys shared preview gateway (API Gateway + S3 bucket + CloudFront)
3. Deploys per-branch preview stack (Cognito, Lambda x2, API GW routes)
4. Uploads frontend to S3 under `<slug>/` prefix
5. Creates Cognito user groups and demo users
6. Invalidates CloudFront cache for `/preview/<slug>/*`
7. Optionally posts a PR comment with preview URL and credentials

---

## `_teardown-preview.yml`

Reusable workflow (`workflow_call`) that tears down a single preview branch stack. Shared by `preview-cleanup.yml` (branch deletion) and `e2e-main.yml` (temporary preview teardown) to avoid duplication.

### Inputs

| Input | Required | Description |
|---|---|---|
| `slug` | Yes | URL-safe branch slug identifying the preview stack to destroy |

### Secrets

| Secret | Required | Description |
|---|---|---|
| `MONGODB_URI` | No | MongoDB connection string. Falls back to a placeholder if not provided. |

### What it does

1. Selects the `preview-<slug>` Terraform workspace (skips gracefully if not found)
2. Runs `terraform destroy` (removes Cognito, Lambda, API GW routes)
3. Deletes frontend assets from the shared S3 bucket (`aws s3 rm`)
4. Deletes the Terraform workspace

---

## `preview-cleanup.yml`

Tears down the preview environment when a branch is deleted. Computes the branch slug, then delegates to `_teardown-preview.yml`.

### Triggers

| Trigger | Condition |
|---|---|
| Branch deletion | Any branch except `main` |

### Jobs

```
slugify ──▶ _teardown-preview.yml
```

---

## `teardown-env.yml`

Manual workflow to destroy all resources for a chosen environment.

### Triggers

| Trigger | Options |
|---|---|
| `workflow_dispatch` | `dev`, `prod`, or `preview` |

### What it does

**For dev/prod:**
- Runs `terraform destroy` against the merged `deploy/` root module

**For preview:**
1. Destroys all per-branch preview workspaces (Cognito, Lambda, API GW routes per branch)
2. Destroys the preview CDN (CloudFront distribution)
3. Destroys the preview gateway (API Gateway + shared S3 bucket — `force_destroy` deletes all files)

---

## `setup-infra.yml`

One-time setup workflow to create the S3 state bucket and DynamoDB lock table for an environment.

---

## Composite Actions

### `.github/actions/terraform-setup/`

Sets up AWS OIDC credentials, installs Terraform, and runs `terraform init` with the correct S3 backend configuration.

### `.github/actions/terraform-action/`

Runs `terraform workspace select -or-create`, `terraform plan`, and `terraform apply` in sequence. Accepts an optional `workspace` input to override the default (which is the `environment` input).

### `.github/actions/slugify-branch/`

Converts a branch name to a URL-safe slug (lowercase, special chars replaced with hyphens, max 40 chars).

### `.github/actions/setup-playwright/`

Installs Node.js, E2E npm dependencies, and Playwright Chromium browser with caching for both npm and browser binaries. Used by `_run-e2e.yml`.

| Input | Default | Description |
|---|---|---|
| `working-directory` | `e2e` | Path to the E2E project directory |
| `node-version` | `24` | Node.js version to install |

### `.github/actions/playwright-report/`

Parses Playwright JSON results, writes a summary table to the GitHub job summary, uploads the HTML report + test artifacts, and optionally posts/updates a PR comment with the E2E results.

| Input | Required | Default | Description |
|---|---|---|---|
| `working-directory` | No | `e2e` | Path to E2E project |
| `artifact-name` | Yes | — | Name for the uploaded report artifact |
| `base-url` | Yes | — | E2E base URL to display in summary |
| `post-to-pr` | No | `false` | Whether to post results as a PR comment |
| `branch-name` | No | `""` | Branch name for PR lookup |

---

## Required GitHub Secrets and Variables (complete list)

| Setting | Type | Scope | Used by |
|---|---|---|---|
| `AWS_OIDC_ROLE_ARN` | Secret | Repository | All deploy/teardown workflows |
| `AWS_ACCOUNT_ID` | Secret | Repository | All deploy/teardown workflows |
| `AWS_REGION` | Variable | Repository | All workflows |
| `MONGODB_URI` | Secret | Per-environment (dev, prod, preview) | `_deploy.yml`, `_deploy-preview.yml`, `_teardown-preview.yml` |
| `PREVIEW_DEMO_PASSWORD` | Secret | Preview environment | `_deploy-preview.yml`, `preview.yml` (E2E), `e2e-main.yml` |
| `PREVIEW_ADMIN_PASSWORD` | Secret | Preview environment | `_deploy-preview.yml` |

### One-time setup per environment

The S3 state bucket and DynamoDB lock table are created by `setup-infra.yml`.
For the very first deployment, trigger it manually:

```
GitHub UI: Actions → Setup Infrastructure → Run workflow → select environment
```

The OIDC identity provider and IAM deployment role must be created separately in IAM
and stored as `AWS_OIDC_ROLE_ARN`. See `infrastructure/aws/README.md` for full details.
