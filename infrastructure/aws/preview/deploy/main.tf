# main.tf — root module entry point for preview environments.
#
# Creates all per-branch resources for a single preview environment.
# Uses the shared dev API Gateway and S3 bucket/CloudFront distribution.
#
# Reads the dev backend remote state to get the shared API Gateway ID.
#
# Dependency order (no circular dependencies):
#   1. module.cognito        — per-branch Cognito User Pool + App Client + Hosted UI.
#   2. module.backend        — per-branch private Lambda (authenticated routes).
#   3. module.backend_public — per-branch public Lambda (unauthenticated /public/* routes).
#   4. module.api_gateway_routes — adds 2 routes to the shared API Gateway for this branch.

locals {
  # Resource name prefix following the breadly-<env>-* convention.
  # Truncated to 36 chars so the longest derived resource name
  # ("${name_prefix}-backend-public-lambda-role" = 36 + 27 = 63 chars) stays
  # within AWS IAM's 64-char role name limit. The full branch_slug is still
  # used in the URL path (frontend_url) and route definitions.
  name_prefix = substr("${var.project_name}-preview-${var.branch_slug}", 0, 36)

  # Frontend URL for the preview environment under the shared CloudFront distribution.
  frontend_url = "${var.cloudfront_url}/preview/${var.branch_slug}"
}

# ---------------------------------------------------------------------------
# Read dev backend state — retrieves shared API Gateway ID
# ---------------------------------------------------------------------------

data "terraform_remote_state" "backend" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-dev-tfstate"
    key    = "env:/dev/backend/terraform.tfstate"
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

  api_gateway_id              = data.terraform_remote_state.backend.outputs.api_gateway_id
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
