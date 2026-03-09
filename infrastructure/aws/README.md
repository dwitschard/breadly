# AWS Infrastructure — Breadly

Terraform configuration for deploying Breadly's frontend to AWS.
All resources are managed via [Terraform](https://www.terraform.io/) and organised into reusable modules.

---

## Directory structure

```
aws/
├── main.sh                          # Entry point — fill in config, then run up/down
├── frontend-stack.sh                # Worker — accepts args, builds frontend, runs Terraform
├── frontend/                        # Root module — frontend deployment
│   ├── providers.tf                 # AWS provider + account guard + optional role assumption
│   ├── backend.tf                   # S3 remote state + DynamoDB locking
│   ├── variables.tf                 # All input variables
│   ├── main.tf                      # Calls modules, workspace-aware resource naming
│   ├── outputs.tf                   # Prints website URL and bucket details after apply
│   ├── envs/
│   │   ├── dev.tfvars               # Dev environment variable values
│   │   └── prod.tfvars              # Prod environment variable values
│   └── modules/
│       └── s3_static_site/          # Reusable module: public S3 static website
│           ├── variables.tf
│           ├── main.tf
│           └── outputs.tf
```

---

## Local usage (test scripts)

`main.sh` is the single entry point for running the stack locally.
Fill in the configuration block at the top of the file, then use one command to deploy or destroy.

### 1. Configure

Open `infrastructure/aws/main.sh` and fill in the configuration block:

```bash
AWS_ACCOUNT_ID="123456789012"
AWS_REGION="eu-central-1"
TF_STATE_BUCKET="123456789012-breadly-tfstate"
TF_LOCK_TABLE="breadly-tfstate-lock"
AWS_ROLE_ARN=""          # optional — leave empty to use ambient credentials
```

Uncomment one of the AWS credential options in the same block (named profile or explicit keys).

### 2. Deploy the dev stack

```bash
./infrastructure/aws/main.sh        # "up" is the default
./infrastructure/aws/main.sh up     # explicit
```

What this does:
1. Validates all arguments and checks that `terraform`, `aws`, and `npm` are on `PATH`
2. Runs `npm ci && npm run build` in `breadly-frontend/` (production mode)
3. `terraform init` with backend config injected from your values
4. `terraform workspace select -or-create dev`
5. `terraform apply -auto-approve -var-file=envs/dev.tfvars`
6. Prints the live website URL

### 3. Tear down the dev stack

```bash
./infrastructure/aws/main.sh down
```

Prompts for confirmation before destroying. The `dev` workspace uses `force_destroy = true` so the S3 bucket is emptied automatically.

### How the two scripts relate

```
main.sh  ──(config values as arguments)──▶  frontend-stack.sh
```

`main.sh` owns all configuration. `frontend-stack.sh` is a pure worker — it accepts everything as positional arguments and contains no hardcoded values. You can call `frontend-stack.sh` directly from other scripts or pipelines by passing values in the same argument order:

```bash
./frontend-stack.sh <up|down> <account_id> <region> <state_bucket> <lock_table> <role_arn>
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

The S3 state bucket and DynamoDB lock table must exist **before** running `terraform init`.
They are intentionally managed outside this configuration to avoid a chicken-and-egg problem.

Create them once (replace the placeholder values):

```bash
ACCOUNT_ID="123456789012"
REGION="eu-central-1"
STATE_BUCKET="${ACCOUNT_ID}-breadly-tfstate"
LOCK_TABLE="breadly-tfstate-lock"

# State bucket
aws s3api create-bucket \
  --bucket "$STATE_BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

# Enable versioning so state history is preserved
aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# DynamoDB lock table (LockID is the required partition key name)
aws dynamodb create-table \
  --table-name "$LOCK_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"
```

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

All commands are run from `infrastructure/aws/frontend/`.

### 1. Build the Angular frontend

```bash
cd breadly-frontend
npm install
npm run build
# Output: breadly-frontend/dist/breadly-frontend/browser/
```

### 2. Initialise Terraform

```bash
cd infrastructure/aws/frontend

terraform init \
  -backend-config="bucket=123456789012-breadly-tfstate" \
  -backend-config="dynamodb_table=breadly-tfstate-lock" \
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
cd infrastructure/aws/frontend
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

### Root module (`frontend/`)

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
# infrastructure/aws/frontend/main.tf

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
| Push to `main` (paths: `breadly-frontend/**` or `infrastructure/aws/frontend/**`) | `dev` — automatic |
| `workflow_dispatch` → select `dev` or `prod` | chosen environment — manual |

**Production is never deployed automatically.** To deploy to prod:
1. Open the repository on GitHub.
2. Go to **Actions → Deploy Frontend**.
3. Click **Run workflow**, select `prod`, and confirm.

### How secrets map to Terraform

All sensitive values are passed into Terraform as `TF_VAR_*` environment variables sourced from GitHub Secrets — nothing is hardcoded in any committed file.

| GitHub Secret | Terraform variable / flag | Purpose |
|---|---|---|
| `AWS_OIDC_ROLE_ARN` | `configure-aws-credentials` action | OIDC role the runner assumes |
| `AWS_REGION` | `TF_VAR_aws_region` + `-backend-config="region=..."` | AWS region |
| `AWS_ACCOUNT_ID` | `TF_VAR_aws_account_id` | Provider account guard |
| `TF_STATE_BUCKET` | `-backend-config="bucket=..."` | S3 state bucket |
| `TF_LOCK_TABLE` | `-backend-config="dynamodb_table=..."` | DynamoDB lock table |

For setup instructions (OIDC trust policy, IAM permissions, adding secrets to the repository) see **`.github/workflows/README.md`**.
