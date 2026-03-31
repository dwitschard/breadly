# GitHub Actions — Workflows

## `build-backend.yml`

Lints, tests, packages and produces a release artifact for the Express backend.
On push to `main`, automatically triggers `deploy.yml` to deploy to `dev`.

---

## `build-frontend.yml`

Lints, tests, and produces a production build artifact for the Angular frontend.
On push to `main`, automatically triggers `deploy.yml` to deploy to `dev`.

### What it does

1. `npm ci`
2. `npm run lint` (Prettier)
3. `npm run test:ci` (Vitest, no-watch)
4. `npm run build` (generates API client, then `ng build`)
5. Uploads `dist/breadly-frontend/browser/` as artifact `frontend-dist` (retained 1 day)

---

## `deploy.yml`

Unified deployment workflow for the merged dev/prod root module (`infrastructure/aws/deploy/`).
Deploys frontend (S3), backend (Lambda), Cognito, API Gateway, and CloudFront in a single Terraform apply.

### Triggers

| Trigger | Target environment |
|---|---|
| Called by `build-backend.yml` on push to `main` | `dev` (automatic) |
| Called by `build-frontend.yml` on push to `main` | `dev` (automatic) |
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

## `preview-deploy.yml`

Deploys a full-stack preview environment for every non-main branch push.
Each preview runs under `/preview/<branch-slug>/` on the dedicated preview CloudFront distribution.

### Triggers

| Trigger | Target |
|---|---|
| Push to any non-`main` branch | Preview environment |

### Jobs

```
slugify ──────┐
build-backend ┼──▶ deploy-preview
build-frontend┘
```

### What it does

1. Ensures shared preview gateway (API Gateway + S3 bucket) is deployed
2. Ensures preview CDN (CloudFront distribution) exists
3. Creates/updates per-branch Terraform workspace (`preview-<slug>`): Cognito, Lambda x2, API GW routes
4. Uploads frontend assets to the shared S3 bucket via `aws s3 sync` under `/<slug>/` key prefix
5. Creates Cognito demo users (demo + admin)
6. Invalidates CloudFront cache for the preview path
7. Posts a PR comment with the preview URL

### Preview URLs

```
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/        # Frontend
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/api/*   # Backend
```

---

## `preview-cleanup.yml`

Tears down the preview environment when a branch is deleted.

### Triggers

| Trigger | Condition |
|---|---|
| Branch deletion | Any branch except `main` |

### What it does

1. Selects the `preview-<slug>` Terraform workspace (skips if not found)
2. Runs `terraform destroy` (removes Cognito, Lambda, API GW routes)
3. Deletes frontend assets from the shared S3 bucket (`aws s3 rm`)
4. Deletes the Terraform workspace

---

## `teardown-application.yml`

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

## `setup-deployment-infrastructure.yml`

One-time setup workflow to create the S3 state bucket and DynamoDB lock table for an environment.

---

## Composite Actions

### `.github/actions/terraform-setup/`

Sets up AWS OIDC credentials, installs Terraform, and runs `terraform init` with the correct S3 backend configuration.

### `.github/actions/terraform-action/`

Runs `terraform workspace select -or-create`, `terraform plan`, and `terraform apply` in sequence. Accepts an optional `workspace` input to override the default (which is the `environment` input).

### `.github/actions/slugify-branch/`

Converts a branch name to a URL-safe slug (lowercase, special chars replaced with hyphens, max 40 chars).

---

## Required GitHub Secrets and Variables (complete list)

| Setting | Type | Scope | Used by |
|---|---|---|---|
| `AWS_OIDC_ROLE_ARN` | Secret | Repository | All deploy/teardown workflows |
| `AWS_ACCOUNT_ID` | Secret | Repository | All deploy/teardown workflows |
| `AWS_REGION` | Variable | Repository | All workflows |
| `MONGODB_URI` | Secret | Per-environment (dev, prod, preview) | `deploy.yml`, `preview-deploy.yml` |
| `PREVIEW_DEMO_PASSWORD` | Secret | Preview environment | `preview-deploy.yml` |
| `PREVIEW_ADMIN_PASSWORD` | Secret | Preview environment | `preview-deploy.yml` |

### One-time setup per environment

The S3 state bucket and DynamoDB lock table are created by `setup-deployment-infrastructure.yml`.
For the very first deployment, trigger it manually:

```
GitHub UI: Actions → Setup Deployment Infrastructure → Run workflow → select environment
```

The OIDC identity provider and IAM deployment role must be created separately in IAM
and stored as `AWS_OIDC_ROLE_ARN`. See `infrastructure/aws/README.md` for full details.
