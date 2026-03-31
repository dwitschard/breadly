# Plan: Extract CloudFront into CDN Module + Consolidate Slug Computation

## Context

The CloudFront distribution currently lives inside `infrastructure/aws/frontend/deploy/` alongside S3 file uploads. The preview deploy workflow (`preview-deploy.yml`) needs to apply the CloudFront cache behaviors (`/preview/*/api/*` and `/preview/*`) but cannot run `terraform apply` on the frontend module without also triggering S3 file uploads (which would overwrite the dev deployment with preview-built files).

Additionally, the branch slugification logic is duplicated in two GitHub Actions workflows (`preview-deploy.yml` and `preview-cleanup.yml`).

## Decision

1. **Extract CloudFront** into a new `infrastructure/aws/cdn/deploy/` Terraform root module that reads S3 and API Gateway info from remote state
2. **Consolidate slug computation** into a `.github/actions/slugify-branch/` composite action (single source of truth for CI/CD)
3. **Accept destroy + recreate** for the one-time migration (brief dev downtime when the old CloudFront is destroyed and a new one is created)
4. **CDN module owns the S3 bucket policy** (cross-module write accepted — the CDN is the sole consumer)

## Tasks

### 1. Create `.github/actions/slugify-branch/action.yml`

Composite action with `branch` input and `slug` output. Contains the canonical shell slugification pipeline (must match `breadly-backend/src/common/branch-slug.ts`):

```yaml
name: Slugify Branch
description: >
  Converts a git branch name to a URL-safe slug (lowercase, max 40 chars).
  Single source of truth for branch slug computation in CI/CD.

inputs:
  branch:
    description: Raw branch name (e.g. github.ref_name or github.event.ref)
    required: true

outputs:
  slug:
    description: URL-safe branch slug (lowercase, max 40 chars, no leading/trailing hyphens)
    value: ${{ steps.slugify.outputs.slug }}

runs:
  using: composite
  steps:
    - name: Slugify branch name
      id: slugify
      shell: bash
      run: |
        RAW="${{ inputs.branch }}"
        # Algorithm (must match breadly-backend/src/common/branch-slug.ts):
        #   1. Lowercase  2. Replace /_.+ with -  3. Strip leading/trailing -
        #   4. Truncate to 40 chars  5. Strip trailing - from truncation
        SLUG=$(echo "$RAW" | tr '[:upper:]' '[:lower:]' | sed 's|[/_.+]|-|g' | sed 's/^-\+//;s/-\+$//' | cut -c1-40 | sed 's/-*$//')
        echo "slug=$SLUG" >> "$GITHUB_OUTPUT"
        echo "Branch slug: $SLUG"
```

### 2. Create `infrastructure/aws/cdn/deploy/` root module

#### `backend.tf`
```hcl
# backend.tf — S3 remote state backend for the CDN module.
# bucket, region, and dynamodb_table are supplied via -backend-config at init time.

terraform {
  backend "s3" {
    bucket = ""
    key    = "cdn/terraform.tfstate"
    region         = ""
    encrypt        = true
    dynamodb_table = ""
  }
}
```

#### `providers.tf`
```hcl
# providers.tf — Terraform and AWS provider configuration.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = terraform.workspace
      ManagedBy   = "terraform"
    }
  }
}
```

#### `variables.tf`
```hcl
variable "aws_account_id" {
  description = "12-digit AWS account ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Short lowercase identifier used as a prefix in all resource names."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-21 chars, starting with a letter."
  }
}
```

#### `main.tf`
```hcl
# main.tf — CDN root module. Provisions a CloudFront distribution backed by the
# S3 static site bucket (from frontend state) and API Gateway (from backend state).

data "terraform_remote_state" "frontend" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-${terraform.workspace}-tfstate"
    key    = "env:/${terraform.workspace}/frontend/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "backend" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-${terraform.workspace}-tfstate"
    key    = "env:/${terraform.workspace}/backend/terraform.tfstate"
    region = var.aws_region
  }
}

module "cdn" {
  source = "./modules/cloudfront"

  name                        = "${var.project_name}-${terraform.workspace}-frontend"
  bucket_id                   = data.terraform_remote_state.frontend.outputs.frontend_bucket_id
  bucket_arn                  = data.terraform_remote_state.frontend.outputs.frontend_bucket_arn
  bucket_regional_domain_name = data.terraform_remote_state.frontend.outputs.frontend_bucket_regional_domain
  api_gateway_url             = data.terraform_remote_state.backend.outputs.api_gateway_endpoint

  tags = {
    Component = "cdn"
  }
}
```

#### `outputs.tf`
```hcl
# outputs.tf — CDN root module outputs.

output "cloudfront_url" {
  description = "HTTPS CloudFront URL."
  value       = module.cdn.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidations."
  value       = module.cdn.cloudfront_distribution_id
}

output "frontend_bucket_id" {
  description = "S3 bucket ID (passthrough from frontend state for workflow convenience)."
  value       = data.terraform_remote_state.frontend.outputs.frontend_bucket_id
}
```

### 3. Move `modules/cloudfront/` from frontend to cdn

Move these 3 files unchanged:
- `infrastructure/aws/frontend/deploy/modules/cloudfront/main.tf` → `infrastructure/aws/cdn/deploy/modules/cloudfront/main.tf`
- `infrastructure/aws/frontend/deploy/modules/cloudfront/variables.tf` → `infrastructure/aws/cdn/deploy/modules/cloudfront/variables.tf`
- `infrastructure/aws/frontend/deploy/modules/cloudfront/outputs.tf` → `infrastructure/aws/cdn/deploy/modules/cloudfront/outputs.tf`

### 4. Update `infrastructure/aws/frontend/deploy/main.tf`

Remove `data "terraform_remote_state" "backend"` block and `module "cdn"` block. Result:

```hcl
# main.tf — root module entry point; manages the S3 static site bucket.

module "frontend" {
  source = "./modules/s3_static_site"

  bucket_name   = "${var.project_name}-${terraform.workspace}-frontend"
  dist_path     = var.frontend_dist_path
  force_destroy = true

  tags = {
    Component = "frontend"
  }
}
```

### 5. Update `infrastructure/aws/frontend/deploy/outputs.tf`

Remove `frontend_cloudfront_url` and `frontend_cloudfront_distribution_id`. Keep S3 outputs:

```hcl
# outputs.tf — root module outputs.

output "frontend_bucket_id" {
  description = "Name of the S3 bucket hosting the frontend."
  value       = module.frontend.bucket_id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket."
  value       = module.frontend.bucket_arn
}

output "frontend_website_url" {
  description = "Public HTTP URL of the deployed frontend."
  value       = module.frontend.website_endpoint
}

output "frontend_bucket_regional_domain" {
  description = "Regional S3 domain name; use as CloudFront origin when needed."
  value       = module.frontend.bucket_regional_domain_name
}

output "frontend_uploaded_file_count" {
  description = "Number of files synced to S3 in the last apply."
  value       = module.frontend.uploaded_file_count
}
```

### 6. Delete `infrastructure/aws/frontend/deploy/modules/cloudfront/` directory

Delete all 3 files:
- `main.tf`
- `variables.tf`
- `outputs.tf`

### 7. Update `.github/workflows/deploy-frontend.yml`

After applying `frontend/deploy/` (S3 only), add CDN setup + apply + output reading:

Replace lines 79-104 with:

```yaml
      - name: Setup Terraform (frontend)
        uses: ./.github/actions/terraform-setup
        with:
          working_dir: infrastructure/aws/frontend/deploy
          environment: ${{ env.TARGET_ENV }}
          session_name: github-deploy-frontend-${{ env.TARGET_ENV }}
          aws_oidc_role_arn: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws_account_id: ${{ secrets.AWS_ACCOUNT_ID }}
          aws_region: ${{ vars.AWS_REGION }}
          project_name: ${{ env.PROJECT_NAME }}

      - name: Deploy frontend stack (S3)
        uses: ./.github/actions/terraform-action
        with:
          working_dir: infrastructure/aws/frontend/deploy
          environment: ${{ env.TARGET_ENV }}
          extra_tf_vars: >-
            -var="frontend_dist_path=${{ github.workspace }}/breadly-frontend/dist/browser"

      - name: Setup Terraform (CDN)
        uses: ./.github/actions/terraform-setup
        with:
          working_dir: infrastructure/aws/cdn/deploy
          environment: ${{ env.TARGET_ENV }}
          session_name: github-deploy-cdn-${{ env.TARGET_ENV }}
          aws_oidc_role_arn: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws_account_id: ${{ secrets.AWS_ACCOUNT_ID }}
          aws_region: ${{ vars.AWS_REGION }}
          project_name: ${{ env.PROJECT_NAME }}

      - name: Deploy CDN stack (CloudFront)
        uses: ./.github/actions/terraform-action
        with:
          working_dir: infrastructure/aws/cdn/deploy
          environment: ${{ env.TARGET_ENV }}

      - name: Invalidate CloudFront cache
        working-directory: infrastructure/aws/cdn/deploy
        run: |
          DIST_ID=$(terraform output -raw cloudfront_distribution_id)
          aws cloudfront create-invalidation \
            --distribution-id "$DIST_ID" \
            --paths "/*"

      - name: Print website URL
        working-directory: infrastructure/aws/cdn/deploy
        run: terraform output -raw cloudfront_url
```

### 8. Update `.github/workflows/preview-deploy.yml`

**Slugify step** (in `slugify` job): Replace lines 50-57 with:
```yaml
      - name: Compute branch slug
        id: slug
        uses: ./.github/actions/slugify-branch
        with:
          branch: ${{ github.ref_name }}
```

**State reads + CDN apply** (in `deploy` job): Replace lines 168-182 with:
```yaml
      - name: Get bucket ID from dev frontend state
        id: frontend
        working-directory: infrastructure/aws/frontend/deploy
        run: |
          terraform init \
            -backend-config="bucket=${{ env.PROJECT_NAME }}-dev-tfstate" \
            -backend-config="dynamodb_table=${{ env.PROJECT_NAME }}-dev-tfstate-lock" \
            -backend-config="region=${{ vars.AWS_REGION }}"
          terraform workspace select dev
          BUCKET_ID=$(terraform output -raw frontend_bucket_id)
          echo "bucket_id=$BUCKET_ID" >> "$GITHUB_OUTPUT"

      - name: Setup Terraform (CDN)
        uses: ./.github/actions/terraform-setup
        with:
          working_dir: infrastructure/aws/cdn/deploy
          environment: dev
          session_name: github-preview-cdn-${{ needs.slugify.outputs.slug }}
          aws_oidc_role_arn: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws_account_id: ${{ secrets.AWS_ACCOUNT_ID }}
          aws_region: ${{ vars.AWS_REGION }}
          project_name: ${{ env.PROJECT_NAME }}

      - name: Ensure CDN behaviors are deployed
        uses: ./.github/actions/terraform-action
        with:
          working_dir: infrastructure/aws/cdn/deploy
          environment: dev

      - name: Get CloudFront outputs from CDN state
        id: cf
        working-directory: infrastructure/aws/cdn/deploy
        run: |
          CF_URL=$(terraform output -raw cloudfront_url)
          echo "cloudfront_url=$CF_URL" >> "$GITHUB_OUTPUT"
          DIST_ID=$(terraform output -raw cloudfront_distribution_id)
          echo "distribution_id=$DIST_ID" >> "$GITHUB_OUTPUT"
```

Then update all references:
- `steps.cf.outputs.bucket_id` → `steps.frontend.outputs.bucket_id`
- `steps.cf.outputs.cloudfront_url` → `steps.cf.outputs.cloudfront_url` (unchanged name)
- `steps.cf.outputs.distribution_id` → `steps.cf.outputs.distribution_id` (unchanged name)

### 9. Update `.github/workflows/preview-cleanup.yml`

**Slugify step**: Replace lines 35-41 with:
```yaml
      - name: Compute branch slug
        id: slug
        uses: ./.github/actions/slugify-branch
        with:
          branch: ${{ github.event.ref }}
```

No other changes needed — the cleanup workflow reads `frontend_bucket_id` from `frontend/deploy/` state (still exists).

### 10. Update `.github/workflows/build-frontend.yml`

Add CDN path to triggers (line 24):
```yaml
      - "infrastructure/aws/cdn/**"
```

## Deployment Procedure (one-time, after merging)

1. `terraform apply` on `frontend/deploy/` in `dev` workspace → destroys CloudFront + bucket policy (downtime starts)
2. `terraform apply` on `cdn/deploy/` in `dev` workspace → creates new CloudFront + bucket policy (downtime ends)
3. Run `deploy-frontend.yml` workflow → uploads files via S3 module, applies CDN (no-op), invalidates CloudFront cache

## Files Summary

| File | Action |
|------|--------|
| `.github/actions/slugify-branch/action.yml` | **Create** |
| `infrastructure/aws/cdn/deploy/backend.tf` | **Create** |
| `infrastructure/aws/cdn/deploy/providers.tf` | **Create** |
| `infrastructure/aws/cdn/deploy/variables.tf` | **Create** |
| `infrastructure/aws/cdn/deploy/main.tf` | **Create** |
| `infrastructure/aws/cdn/deploy/outputs.tf` | **Create** |
| `infrastructure/aws/cdn/deploy/modules/cloudfront/main.tf` | **Move** from frontend |
| `infrastructure/aws/cdn/deploy/modules/cloudfront/variables.tf` | **Move** from frontend |
| `infrastructure/aws/cdn/deploy/modules/cloudfront/outputs.tf` | **Move** from frontend |
| `infrastructure/aws/frontend/deploy/main.tf` | **Edit** — remove CDN |
| `infrastructure/aws/frontend/deploy/outputs.tf` | **Edit** — remove CloudFront outputs |
| `infrastructure/aws/frontend/deploy/modules/cloudfront/` | **Delete** (3 files) |
| `.github/workflows/deploy-frontend.yml` | **Edit** |
| `.github/workflows/preview-deploy.yml` | **Edit** |
| `.github/workflows/preview-cleanup.yml` | **Edit** |
| `.github/workflows/build-frontend.yml` | **Edit** |
