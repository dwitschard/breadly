# AWS Infrastructure — Breadly

Terraform configuration for deploying Breadly's frontend to AWS.
All resources are managed via [Terraform](https://www.terraform.io/) and organised into reusable modules.

---

## Directory structure

```
aws/
├── frontend/
│   ├── bootstrap/                   # Run once per environment to create state bucket + lock table
│   │   ├── providers.tf             # AWS provider (no role assumption)
│   │   ├── backend.tf               # Local backend (state stored on disk, gitignored)
│   │   ├── variables.tf             # aws_account_id, aws_region, project_name, environment
│   │   ├── main.tf                  # S3 state bucket, DynamoDB lock table
│   │   └── outputs.tf               # Prints bucket/table names and next steps
│   └── infra/                       # Root module — frontend deployment (runs on every deploy)
│       ├── providers.tf             # AWS provider + account guard + optional role assumption
│       ├── backend.tf               # S3 remote state + DynamoDB locking
│       ├── variables.tf             # All input variables
│       ├── main.tf                  # Calls modules, workspace-aware resource naming
│       ├── outputs.tf               # Prints website URL and bucket details after apply
│       ├── envs/
│       │   ├── dev.tfvars           # Dev environment variable values
│       │   └── prod.tfvars          # Prod environment variable values
│       └── modules/
│           └── s3_static_site/      # Reusable module: public S3 static website
│               ├── variables.tf
│               ├── main.tf
│               └── outputs.tf
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

The S3 state bucket and DynamoDB lock table are managed by the `frontend/bootstrap/` Terraform root.
Run this **once per environment per AWS account** before the first frontend deployment.

Bootstrap creates:

| Resource | Name pattern | Purpose |
|---|---|---|
| S3 bucket | `<project>-<env>-tfstate` | Stores Terraform remote state |
| DynamoDB table | `<project>-<env>-tfstate-lock` | Terraform state locking |

### Run bootstrap

```bash
cd infrastructure/aws/frontend/bootstrap

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
`infrastructure/aws/frontend/bootstrap/terraform.tfstate` and is covered by `.gitignore`.
Back it up somewhere safe (a personal S3 bucket or a password manager) so you
can manage bootstrap resources later (e.g. adding a new environment).

---

## Configuration

### Setting your AWS account ID

Each environment's `.tfvars` file contains a placeholder for the AWS account ID.
**Do not commit real account IDs to source control.** Supply them at apply time via an environment variable:

```bash
export TF_VAR_aws_account_id="123456789012"
```

Or pass them as a `-var` flag:

```bash
terraform apply -var-file=envs/dev.tfvars -var="aws_account_id=123456789012"
```

### Cross-account deployments (optional)

To deploy via an IAM role (recommended for CI/CD):

```bash
export TF_VAR_aws_role_arn="arn:aws:iam::123456789012:role/BreadlyTerraformDeployer"
```

The provider will assume this role before making any AWS API call.

---

## Deployment workflow

All commands are run from `infrastructure/aws/frontend/infra/`.

### 1. Build the Angular frontend

```bash
cd breadly-frontend
npm install
npm run build
# Output: breadly-frontend/dist/breadly-frontend/browser/
```

### 2. Initialise Terraform

```bash
cd infrastructure/aws/frontend/infra

terraform init \
  -backend-config="bucket=breadly-dev-tfstate" \
  -backend-config="dynamodb_table=breadly-dev-tfstate-lock" \
  -backend-config="region=eu-central-1"
```

### 3. Select a workspace

Workspaces keep dev and prod state and resource names fully isolated.

```bash
# Create the workspace on first use, then select it on subsequent runs
terraform workspace select -or-create dev    # or prod
terraform workspace list                     # confirm active workspace
```

### 4. Plan

Review what Terraform will create before applying:

```bash
terraform plan -var-file=envs/dev.tfvars
```

### 5. Apply

```bash
terraform apply -var-file=envs/dev.tfvars
```

After a successful apply, the website URL is printed:

```
Outputs:
  frontend_website_url = "http://breadly-dev-frontend.s3-website.eu-central-1.amazonaws.com"
```

### Deploying to production

```bash
terraform workspace select prod
terraform apply -var-file=envs/prod.tfvars
```

---

## Re-deploying after a frontend change

The S3 upload uses each file's MD5 hash (`etag`) to detect changes.
Only modified files are re-uploaded — no full re-sync is needed.

```bash
# 1. Rebuild
cd breadly-frontend && npm run build

# 2. Apply (Terraform will upload only changed files)
cd infrastructure/aws/frontend/infra
terraform apply -var-file=envs/dev.tfvars
```

---

## Tear down

```bash
# Dev — bucket is emptied and destroyed automatically (force_destroy = true)
terraform workspace select dev
terraform destroy -var-file=envs/dev.tfvars

# Prod — protected; force_destroy is false, so you must empty the bucket
# manually before destroy will succeed
terraform workspace select prod
terraform destroy -var-file=envs/prod.tfvars
```

---

## Inputs reference

### Root module (`frontend/infra/`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `aws_account_id` | `string` | — | 12-digit AWS account ID. Required. |
| `aws_region` | `string` | `eu-central-1` | AWS region for all resources. |
| `aws_role_arn` | `string` | `""` | IAM role ARN to assume. Empty = use current credentials. |
| `project_name` | `string` | `breadly` | Prefix applied to all resource names. |
| `frontend_dist_path` | `string` | `../../../breadly-frontend/dist/breadly-frontend/browser` | Path to the compiled Angular output. |
| `index_document` | `string` | `index.html` | S3 website index document. |
| `error_document` | `string` | `index.html` | S3 website error document (same as index for SPA routing). |

### `s3_static_site` module

| Variable | Type | Default | Description |
|---|---|---|---|
| `bucket_name` | `string` | — | Globally unique S3 bucket name. |
| `dist_path` | `string` | — | Path to compiled frontend files to upload. |
| `index_document` | `string` | `index.html` | Website index document. |
| `error_document` | `string` | `index.html` | Website error document. |
| `force_destroy` | `bool` | `false` | Allow bucket deletion even if non-empty. |
| `tags` | `map(string)` | `{}` | Additional resource tags. |

---

## Outputs reference

| Output | Description |
|---|---|
| `frontend_website_url` | Public HTTP URL of the deployed frontend. |
| `frontend_website_domain` | Bare domain of the S3 website endpoint. |
| `frontend_bucket_id` | Name of the S3 bucket. |
| `frontend_bucket_arn` | ARN of the S3 bucket (for IAM policies). |
| `frontend_bucket_regional_domain` | Regional S3 domain — use as CloudFront origin if added later. |
| `frontend_uploaded_file_count` | Number of files synced in the last apply. |
| `active_workspace` | Terraform workspace active during this apply. |

---

## Extending the infrastructure

Add new modules alongside `s3_static_site/` in the `modules/` directory, then call them from `main.tf`:

```hcl
# infrastructure/aws/frontend/infra/main.tf

module "api_ecs" {
  source = "./modules/ecs_service"
  # ...
}
```

Each module is self-contained and can be composed independently without modifying existing resources.

---

## CI/CD

Deployments are driven by the GitHub Actions workflow at
`.github/workflows/deploy-frontend.yml`.

### Triggers

| Event | Environment deployed |
|---|---|
| Push to `main` (paths: `breadly-frontend/**` or `infrastructure/aws/frontend/infra/**`) | `dev` — automatic |
| `workflow_dispatch` → select `dev` or `prod` | chosen environment — manual |

**Production is never deployed automatically.** To deploy to prod:
1. Open the repository on GitHub.
2. Go to **Actions → Deploy Frontend**.
3. Click **Run workflow**, select `prod`, and confirm.

### How secrets and variables map to Terraform

All sensitive values are passed into Terraform as `TF_VAR_*` environment variables sourced from GitHub Secrets — nothing is hardcoded in any committed file. Non-sensitive values are stored as GitHub Variables.

| GitHub setting | Type | Terraform variable / flag | Purpose |
|---|---|---|---|
| `AWS_OIDC_ROLE_ARN` | Secret | `configure-aws-credentials` action | OIDC role the runner assumes (created manually in IAM) |
| `AWS_ACCOUNT_ID` | Secret | `TF_VAR_aws_account_id` | Provider account guard |
| `AWS_REGION` | Variable | `TF_VAR_aws_region` + `-backend-config="region=..."` | AWS region |

> `TF_STATE_BUCKET` and `TF_LOCK_TABLE` are not required as GitHub Variables.
> Both workflows derive their names from `AWS_ACCOUNT_ID` and the target environment
> using the convention: `breadly-<env>-tfstate` and `breadly-<env>-tfstate-lock`.

For setup instructions (OIDC trust policy, IAM permissions, adding secrets to the repository) see **`.github/workflows/README.md`**.
