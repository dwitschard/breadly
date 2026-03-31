# main.tf — root module entry point for preview environments.
#
# Creates all per-branch resources for a single preview environment.
# Uses the shared preview API Gateway and preview CloudFront distribution.
# Each preview gets its own S3 bucket for frontend assets.
#
# Reads the preview gateway remote state to get the shared API Gateway ID.
#
# Dependency order (no circular dependencies):
#   1. module.frontend       — per-branch S3 bucket for frontend assets.
#   2. module.cognito        — per-branch Cognito User Pool + App Client + Hosted UI.
#   3. module.backend        — per-branch private Lambda (authenticated routes).
#   4. module.backend_public — per-branch public Lambda (unauthenticated /public/* routes).
#   5. module.api_gateway_routes — adds 2 routes to the shared API Gateway for this branch.

locals {
  # Full resource name prefix before any truncation.
  full_prefix      = "${var.project_name}-preview-${var.branch_slug}"
  needs_truncation = length(local.full_prefix) > 36

  # Resource name prefix following the breadly-<env>-* convention.
  # Must stay ≤ 36 chars so the longest derived resource name
  # ("${name_prefix}-backend-public-lambda-role" = 36 + 27 = 63 chars) stays
  # within AWS IAM's 64-char role name limit.
  #
  # When the full prefix exceeds 36 chars, the last 7 positions are replaced
  # with a dash + 6-char SHA-256 hash of the full prefix (29 + 1 + 6 = 36).
  # This guarantees uniqueness even when two branch slugs share the same
  # first 29 characters. The full branch_slug is still used in the URL path
  # (frontend_url) and API Gateway route definitions.
  name_prefix = local.needs_truncation ? (
    "${substr(local.full_prefix, 0, 29)}-${substr(sha256(local.full_prefix), 0, 6)}"
  ) : local.full_prefix

  # Frontend URL for the preview environment under the shared CloudFront distribution.
  frontend_url = "${var.cloudfront_url}/preview/${var.branch_slug}"
}

# ---------------------------------------------------------------------------
# Per-branch S3 bucket for frontend assets
# ---------------------------------------------------------------------------

module "frontend" {
  source = "../../frontend/deploy/modules/s3_static_site"

  bucket_name   = "${local.name_prefix}-frontend"
  dist_path     = var.frontend_dist_path
  force_destroy = true

  tags = {
    Component  = "preview"
    BranchSlug = var.branch_slug
  }
}

# ---------------------------------------------------------------------------
# Read preview gateway state — retrieves shared API Gateway ID
# ---------------------------------------------------------------------------

data "terraform_remote_state" "gateway" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-preview-tfstate"
    key    = "env:/preview/gateway/terraform.tfstate"
    region = var.aws_region
  }
}

# ---------------------------------------------------------------------------
# Per-branch Cognito User Pool
# ---------------------------------------------------------------------------

module "cognito" {
  source = "../../modules/cognito"

  name                       = local.name_prefix
  aws_region                 = var.aws_region
  frontend_urls              = local.frontend_url
  enable_admin_password_auth = true

  tags = {
    Component   = "preview"
    BranchSlug  = var.branch_slug
  }
}

# ---------------------------------------------------------------------------
# Per-branch private Lambda (authenticated routes)
# ---------------------------------------------------------------------------

module "backend" {
  source = "../../modules/lambda_express"

  name          = "${local.name_prefix}-backend"
  dist_zip_path = var.dist_zip_path
  aws_region    = var.aws_region
  mongodb_uri   = var.mongodb_uri

  extra_env_vars = {
    PREVIEW_PATH_PREFIX = "/preview/${var.branch_slug}"
  }

  tags = {
    Component  = "preview"
    BranchSlug = var.branch_slug
  }
}

# ---------------------------------------------------------------------------
# Per-branch public Lambda (unauthenticated /public/* routes)
# ---------------------------------------------------------------------------

module "backend_public" {
  source = "../../modules/lambda_express"

  name          = "${local.name_prefix}-backend-public"
  dist_zip_path = var.dist_zip_path
  aws_region    = var.aws_region
  mongodb_uri   = var.mongodb_uri

  extra_env_vars = {
    COGNITO_ISSUER    = module.cognito.issuer_url
    COGNITO_CLIENT_ID = module.cognito.client_id
    PREVIEW_PATH_PREFIX = "/preview/${var.branch_slug}"
  }

  tags = {
    Component  = "preview"
    BranchSlug = var.branch_slug
  }
}

# ---------------------------------------------------------------------------
# Per-branch API Gateway routes on the shared HTTP API
# ---------------------------------------------------------------------------

module "api_gateway_routes" {
  source = "./modules/api_gateway_routes"

  api_gateway_id              = data.terraform_remote_state.gateway.outputs.api_gateway_id
  branch_slug                 = var.branch_slug
  lambda_function_arn         = module.backend.function_arn
  lambda_function_name        = module.backend.function_name
  public_lambda_function_arn  = module.backend_public.function_arn
  public_lambda_function_name = module.backend_public.function_name
  cognito_issuer_url          = module.cognito.issuer_url
  cognito_user_pool_client_id = module.cognito.client_id
  aws_region                  = var.aws_region
  aws_account_id              = var.aws_account_id

  tags = {
    Component  = "preview"
    BranchSlug = var.branch_slug
  }
}
