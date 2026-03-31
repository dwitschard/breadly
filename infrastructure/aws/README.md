# AWS Infrastructure — Breadly

Terraform configuration for deploying Breadly to AWS.
All resources are managed via [Terraform](https://www.terraform.io/) and organised into reusable modules.

---

## Architecture overview

Breadly runs on AWS with the following high-level architecture:

- **Frontend** — Angular SPA hosted in S3, served through CloudFront
- **Backend** — Express API running on Lambda (dual: private + public), exposed through API Gateway
- **CDN** — CloudFront distribution that routes traffic to S3 (static assets) and API Gateway (API requests)
- **Preview environments** — per-branch full-stack deployments under `/preview/<slug>/` on a dedicated preview CloudFront distribution, with a single shared S3 bucket using key prefixes for isolation

### Request routing (CloudFront)

**Dev/Prod distribution:**

```
CloudFront Distribution
├── /api/*           → API Gateway (main backend)
└── /* (default)     → Main S3 bucket (Angular SPA)
```

**Preview distribution:**

```
CloudFront Distribution
├── /preview/*/api/* → API Gateway (preview backends, per-branch routes)
├── /preview/*       → Shared S3 bucket (CF Function prepends /<slug>/ key prefix)
└── /* (default)     → Fallback
```

Each preview environment stores frontend assets under a `/<slug>/` key prefix in the shared S3 bucket. A CloudFront Function strips the `/preview/<slug>` prefix and prepends the slug as an S3 key prefix, rewriting SPA deep links to `/<slug>/index.html`.

---

## Directory structure

```
aws/
├── deploy/                              # Merged root module — dev/prod (frontend + backend + CDN)
│   ├── providers.tf
│   ├── backend.tf                       # S3 remote state (key: deploy/terraform.tfstate)
│   ├── variables.tf
│   ├── main.tf                          # Orchestrates: S3, Cognito, Lambda x2, API GW, CloudFront
│   └── outputs.tf
├── frontend/
│   ├── setup/                           # Run once per environment to create state bucket + lock table
│   │   ├── providers.tf
│   │   ├── backend.tf                   # Local backend (state stored on disk, gitignored)
│   │   ├── variables.tf
│   │   ├── main.tf
│   │   └── outputs.tf
│   └── deploy/
│       └── modules/
│           └── s3_static_site/          # Reusable module: S3 bucket + file upload
│               ├── variables.tf
│               ├── main.tf
│               └── outputs.tf
├── backend/
│   └── deploy/
│       └── modules/
│           └── api_gateway/             # API Gateway HTTP API + routes + authorizer
│               ├── variables.tf
│               ├── main.tf
│               └── outputs.tf
├── cdn/
│   └── deploy/                          # Root module — CloudFront distribution (also used standalone for preview CDN)
│       ├── providers.tf
│       ├── backend.tf
│       ├── variables.tf                 # preview_only flag for preview-only mode
│       ├── main.tf                      # Reads remote state (deploy or gateway), calls cloudfront module
│       ├── outputs.tf
│       └── modules/
│           └── cloudfront/              # CloudFront distribution, OAC, bucket policies, CF Function
│               ├── variables.tf
│               ├── main.tf
│               └── outputs.tf
├── preview/
│   ├── gateway/                         # Shared preview infrastructure (API Gateway + S3 bucket)
│   │   ├── providers.tf
│   │   ├── backend.tf
│   │   ├── variables.tf
│   │   ├── main.tf                      # Shared API Gateway + shared S3 bucket for all previews
│   │   └── outputs.tf
│   └── deploy/                          # Per-branch preview environment
│       ├── providers.tf
│       ├── backend.tf
│       ├── variables.tf                 # branch_slug, dist_zip_path, cloudfront_url
│       ├── main.tf                      # Per-preview: Cognito, Lambda x2, API GW routes
│       ├── outputs.tf
│       └── modules/
│           └── api_gateway_routes/      # Adds preview routes to the shared API Gateway
│               └── ...
├── modules/                             # Shared modules used across root modules
│   ├── cognito/                         # Cognito User Pool + App Client + Hosted UI
│   └── lambda_express/                  # Lambda function with Express handler
└── README.md
```

---

## Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| [Terraform](https://developer.hashicorp.com/terraform/install) | 1.6.0 | `brew install terraform` |
| [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) | 2.x | `brew install awscli` |
| [Node.js](https://nodejs.org/) + npm | 20.x | `brew install node` |
| Angular CLI | 21.x | `npm install -g @angular/cli` |

AWS credentials must be available in the environment before running any Terraform command:

```bash
# Option A — named profile
export AWS_PROFILE=my-profile

# Option B — environment variables
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...        # if using temporary credentials
```

---

## One-time bootstrap

The S3 state bucket and DynamoDB lock table are managed by the `frontend/setup/` Terraform root.
Run this **once per environment per AWS account** before the first deployment.

Bootstrap creates:

| Resource | Name pattern | Purpose |
|---|---|---|
| S3 bucket | `<project>-<env>-tfstate` | Stores Terraform remote state |
| DynamoDB table | `<project>-<env>-tfstate-lock` | Terraform state locking |

### Run bootstrap

```bash
cd infrastructure/aws/frontend/setup

terraform init

# For dev:
terraform apply \
  -var="aws_account_id=123456789012" \
  -var="aws_region=eu-central-1"    \
  -var="environment=dev"

# For prod:
terraform apply \
  -var="aws_account_id=123456789012" \
  -var="aws_region=eu-central-1"    \
  -var="environment=prod"
```

Credentials used here must have permission to create S3 buckets and DynamoDB tables.

### Store the outputs as GitHub repository settings

After each `terraform apply` completes, the output block prints all required values.
The deploy workflow derives the state bucket and lock table names automatically from
`AWS_ACCOUNT_ID` and the environment, so only the following need to be stored in GitHub:

```
Settings → Secrets and variables → Actions → Variables:
  AWS_REGION       = eu-central-1

Settings → Secrets and variables → Actions → Secrets:
  AWS_ACCOUNT_ID   = 123456789012
  AWS_OIDC_ROLE_ARN = <ARN of your IAM role for GitHub Actions OIDC>
```

### Bootstrap state file

The bootstrap root uses a **local backend** — its state file is stored at
`infrastructure/aws/frontend/setup/terraform.tfstate` and is covered by `.gitignore`.
Back it up somewhere safe (a personal S3 bucket or a password manager) so you
can manage bootstrap resources later (e.g. adding a new environment).

---

## Terraform root modules

### `deploy/` — Merged dev/prod root

The unified root module for dev and prod environments. Orchestrates all resources in a single `terraform apply`:

- **S3 static site** — Angular SPA bucket + file upload (via `frontend/deploy/modules/s3_static_site`)
- **Cognito** — User Pool + App Client + Hosted UI (via `modules/cognito`)
- **Lambda x2** — private (authenticated) + public (unauthenticated) Express backends (via `modules/lambda_express`)
- **API Gateway** — HTTP API with routes and JWT authorizer (via `backend/deploy/modules/api_gateway`)
- **CloudFront** — CDN distribution fronting S3 + API Gateway (via `cdn/deploy/modules/cloudfront`)

Cognito callback URLs are computed internally from the CloudFront domain — no external `frontend_urls` variable needed. Uses Terraform workspaces (`dev`, `prod`) for environment isolation.

### `cdn/deploy/` — CloudFront distribution (standalone for preview)

In dev/prod, the CloudFront module is called directly from `deploy/`. The `cdn/deploy/` root module is used standalone only for the **preview CDN**, where it reads remote state from `preview/gateway/` to get the API Gateway endpoint and shared S3 bucket details.

Set `preview_only = true` when deploying for preview environments.

### `preview/gateway/` — Shared preview infrastructure

Creates resources shared across all preview branches:

- **API Gateway HTTP API** — single shared gateway; each preview branch adds routes
- **S3 bucket** — single shared bucket for all preview frontend assets (key prefix per branch)

Deployed once and updated infrequently.

### `preview/deploy/` — Per-branch preview environment

Creates all per-branch resources for a single preview. Uses Terraform workspaces (`preview-<slug>`) to isolate state per branch.

Each preview creates:
- **Cognito User Pool** — per-preview with demo users and groups
- **Lambda x2** — private (authenticated) + public (unauthenticated) Express backends
- **API Gateway routes** — added to the shared preview API Gateway under `/preview/<slug>/api/*`

Frontend files are uploaded to the shared S3 bucket by the workflow via `aws s3 sync`, not by Terraform.

---

## Preview environments

### How it works

1. **Deploy** (`preview-deploy.yml`) — triggered on push to any non-main branch:
   - Builds frontend with `--base-href=/preview/<slug>/`
   - Builds backend as a Lambda zip
   - Ensures shared gateway (API Gateway + S3 bucket) and CDN are deployed
   - Creates/updates preview workspace (`preview-<slug>`) with Cognito, Lambda, and API Gateway routes
   - Uploads frontend assets to the shared S3 bucket under `/<slug>/` key prefix via `aws s3 sync`
   - Invalidates the CloudFront cache for the preview path

2. **Cleanup** (`preview-cleanup.yml`) — triggered when a branch is deleted:
   - Runs `terraform destroy` in the preview workspace (destroys Cognito, Lambda, API GW routes)
   - Deletes frontend assets from the shared S3 bucket (`aws s3 rm s3://<bucket>/<slug>/ --recursive`)
   - Deletes the Terraform workspace

### Preview URLs

```
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/        # Frontend SPA
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/api/*   # Backend API
```

There is no hard limit on the number of concurrent preview environments. The CDN has a single static `/preview/*` cache behavior for the shared S3 bucket, so adding previews does not consume additional CloudFront behaviors.

---

## Configuration

### Setting your AWS account ID

**Do not commit real account IDs to source control.** Supply them at apply time via an environment variable:

```bash
export TF_VAR_aws_account_id="123456789012"
```

Or pass them as a `-var` flag:

```bash
terraform apply -var="aws_account_id=123456789012"
```

### Cross-account deployments (optional)

To deploy via an IAM role (recommended for CI/CD):

```bash
export TF_VAR_aws_role_arn="arn:aws:iam::123456789012:role/BreadlyTerraformDeployer"
```

The provider will assume this role before making any AWS API call.

---

## CI/CD

Deployments are driven by GitHub Actions workflows.

### Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy.yml` | Called by `build-backend.yml` or `build-frontend.yml` on push to `main` | Deploys backend + frontend + CDN to dev via merged root |
| `preview-deploy.yml` | Push to any non-main branch | Deploys full-stack preview environment |
| `preview-cleanup.yml` | Branch deletion | Tears down preview environment |
| `teardown-application.yml` | Manual dispatch | Destroys all resources for a chosen environment |

**Production is never deployed automatically.** Use manual workflow dispatch on `deploy.yml`.

### GitHub secrets and variables

| GitHub setting | Type | Purpose |
|---|---|---|
| `AWS_OIDC_ROLE_ARN` | Secret | OIDC role the runner assumes |
| `AWS_ACCOUNT_ID` | Secret | Provider account guard |
| `AWS_REGION` | Variable | AWS region for all resources |
| `MONGODB_URI` | Secret (per-env) | MongoDB connection string for Lambda |
| `PREVIEW_DEMO_PASSWORD` | Secret (preview) | Password for preview demo user |
| `PREVIEW_ADMIN_PASSWORD` | Secret (preview) | Password for preview admin user |

> State bucket and lock table names are derived automatically from `AWS_ACCOUNT_ID`
> and the environment using the convention: `breadly-<env>-tfstate` / `breadly-<env>-tfstate-lock`.

For setup instructions (OIDC trust policy, IAM permissions, adding secrets to the repository) see **`.github/workflows/README.md`**.
