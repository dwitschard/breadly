# AWS Infrastructure — Breadly

Terraform configuration for deploying Breadly to AWS.
All resources are managed via [Terraform](https://www.terraform.io/) and organised into reusable modules.

---

## Architecture overview

Breadly runs on AWS with the following high-level architecture:

- **Frontend** — Angular SPA hosted in S3, served through CloudFront
- **Backend** — Express API running on Lambda, exposed through API Gateway
- **CDN** — CloudFront distribution that routes traffic to S3 (static assets) and API Gateway (API requests)
- **Preview environments** — per-branch full-stack deployments under `/preview/<slug>/` on the shared dev CloudFront distribution, each with a dedicated S3 bucket

### Request routing (CloudFront)

```
CloudFront Distribution
├── /api/*                     → API Gateway (main backend)
├── /preview/*/api/*           → API Gateway (preview backends)
├── /preview/<slug>/*          → Per-preview S3 bucket (CF Function strips prefix)
└── /* (default)               → Main S3 bucket (Angular SPA)
```

Each preview environment gets its own S3 bucket. A CloudFront Function strips the `/preview/<slug>` prefix from the URI before forwarding to S3, and rewrites SPA deep links to `/index.html`.

---

## Directory structure

```
aws/
├── frontend/
│   ├── setup/                       # Run once per environment to create state bucket + lock table
│   │   ├── providers.tf
│   │   ├── backend.tf               # Local backend (state stored on disk, gitignored)
│   │   ├── variables.tf
│   │   ├── main.tf                  # S3 state bucket, DynamoDB lock table
│   │   └── outputs.tf
│   └── deploy/                      # Root module — frontend S3 bucket + file upload
│       ├── providers.tf
│       ├── backend.tf               # S3 remote state + DynamoDB locking
│       ├── variables.tf
│       ├── main.tf
│       ├── outputs.tf
│       └── modules/
│           └── s3_static_site/      # Reusable module: S3 bucket + file upload via aws_s3_object
│               ├── variables.tf
│               ├── main.tf
│               └── outputs.tf
├── backend/
│   └── deploy/                      # Root module — Lambda + API Gateway
│       ├── providers.tf
│       ├── backend.tf
│       ├── variables.tf
│       ├── main.tf
│       ├── outputs.tf
│       └── modules/
│           └── ...
├── cdn/
│   └── deploy/                      # Root module — CloudFront distribution
│       ├── providers.tf
│       ├── backend.tf
│       ├── variables.tf             # Includes preview_buckets map variable
│       ├── main.tf                  # Reads frontend + backend remote state, calls cloudfront module
│       ├── outputs.tf
│       └── modules/
│           └── cloudfront/          # CloudFront distribution, OAC, bucket policies
│               ├── variables.tf
│               ├── main.tf          # Dynamic preview origins, CF Function, per-preview cache behaviors
│               └── outputs.tf
├── preview/
│   └── deploy/                      # Root module — per-branch preview environment
│       ├── providers.tf
│       ├── backend.tf
│       ├── variables.tf             # Includes branch_slug, frontend_dist_path
│       ├── main.tf                  # Per-preview: S3 bucket, Cognito, Lambda x2, API GW routes
│       ├── outputs.tf               # Exposes frontend_bucket_id/arn/regional_domain_name
│       └── modules/
│           └── api_gateway_routes/  # Adds preview routes to the shared API Gateway
│               └── ...
├── modules/                         # Shared modules used across root modules
│   ├── cognito/                     # Cognito User Pool + App Client + Hosted UI
│   └── lambda_express/              # Lambda function with Express handler
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

### `frontend/deploy/` — Main frontend

Creates the S3 bucket and uploads the compiled Angular SPA. The bucket is private (no public access); CloudFront serves files via OAC.

### `backend/deploy/` — Main backend

Creates Lambda functions (private + public) and an API Gateway HTTP API.

### `cdn/deploy/` — CloudFront distribution

Creates the CloudFront distribution that fronts both the S3 bucket and API Gateway. Accepts a `preview_buckets` variable (map of objects) to dynamically create per-preview S3 origins, OACs, bucket policies, and ordered cache behaviors.

Reads remote state from `frontend/deploy/` and `backend/deploy/` to get the S3 bucket details and API Gateway endpoint.

### `preview/deploy/` — Preview environments

Creates all per-branch resources for a single preview environment. Uses Terraform workspaces (`preview-<slug>`) to isolate state per branch.

Each preview creates:
- **S3 bucket** — dedicated per-preview bucket for frontend assets (via the `s3_static_site` module)
- **Cognito User Pool** — per-preview with demo users and groups
- **Lambda x2** — private (authenticated) + public (unauthenticated) Express backends
- **API Gateway routes** — added to the shared dev API Gateway under `/preview/<slug>/api/*`

---

## Preview environments

### How it works

1. **Deploy** (`preview-deploy.yml`) — triggered on push to any non-main branch:
   - Builds frontend with `--base-href=/preview/<slug>/`
   - Builds backend as a Lambda zip
   - Creates/updates preview workspace (`preview-<slug>`) with its own S3 bucket, Cognito, Lambda, and API Gateway routes
   - Collects all active preview bucket outputs from all `preview-*` workspaces
   - Updates the CDN module with the full `preview_buckets` map to add/update CloudFront origins
   - Invalidates the CloudFront cache for the preview path

2. **Cleanup** (`preview-cleanup.yml`) — triggered when a branch is deleted:
   - Runs `terraform destroy` in the preview workspace (destroys S3 bucket, Cognito, Lambda, API GW routes)
   - Collects remaining preview bucket outputs from surviving workspaces
   - Updates the CDN module to remove the deleted preview's origin and cache behavior
   - Deletes the Terraform workspace

### Limits

- Maximum **5 concurrent preview environments** (enforced at deploy time)
- CloudFront has a 25 cache behavior limit; with 3 static behaviors + 1 per preview, 5 previews uses 8 total

### Preview URLs

```
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/        # Frontend SPA
https://<cloudfront-id>.cloudfront.net/preview/<branch-slug>/api/*   # Backend API
```

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
| `deploy-frontend.yml` | Push to `main` (frontend/infra paths) or manual dispatch | Deploys frontend to dev or prod |
| `preview-deploy.yml` | Push to any non-main branch | Deploys full-stack preview environment |
| `preview-cleanup.yml` | Branch deletion | Tears down preview environment |

**Production is never deployed automatically.** Use manual workflow dispatch.

### GitHub secrets and variables

| GitHub setting | Type | Purpose |
|---|---|---|
| `AWS_OIDC_ROLE_ARN` | Secret | OIDC role the runner assumes |
| `AWS_ACCOUNT_ID` | Secret | Provider account guard |
| `AWS_REGION` | Variable | AWS region for all resources |
| `MONGODB_URI` | Secret | MongoDB connection string for Lambda |
| `PREVIEW_DEMO_PASSWORD` | Secret | Password for preview demo user |
| `PREVIEW_ADMIN_PASSWORD` | Secret | Password for preview admin user |

> State bucket and lock table names are derived automatically from `AWS_ACCOUNT_ID`
> and the environment using the convention: `breadly-<env>-tfstate` / `breadly-<env>-tfstate-lock`.

For setup instructions (OIDC trust policy, IAM permissions, adding secrets to the repository) see **`.github/workflows/README.md`**.
