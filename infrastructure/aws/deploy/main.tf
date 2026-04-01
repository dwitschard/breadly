# main.tf — merged root module for dev/prod deployments.
#
# Combines what was previously three separate root modules (frontend/deploy,
# backend/deploy, cdn/deploy) into a single deployment unit. This eliminates
# cross-stack remote state reads and the need to pass frontend_urls between
# stacks — the CloudFront URL is computed internally.
#
# Dependency order (no circular dependencies):
#   1. module.frontend         — S3 bucket for the Angular SPA.
#   2. module.api_gateway (partial) — HTTP API + Stage (no routes yet, no authorizer).
#   3. module.cdn              — CloudFront distribution. Uses S3 bucket details
#                                 and API Gateway endpoint as origins.
#   4. module.cognito          — Cognito User Pool + App Client. Receives
#                                 frontend_urls derived from CloudFront domain.
#   5. module.backend          — Private Lambda (authenticated routes).
#   6. module.backend_public   — Public Lambda (unauthenticated /public/* routes).
#                                 Receives Cognito values as env vars.
#   7. module.api_gateway (routes + authorizer) — Wired up by the api_gateway
#                                 module internally; depends on Cognito + Lambdas.
#
# In practice Terraform resolves this at the resource level:
#   API + Stage → CloudFront → Cognito → API Gateway authorizer → routes
#   This is a valid DAG with no cycle.

# ---------------------------------------------------------------------------
# Locals
# ---------------------------------------------------------------------------

locals {
  name_prefix    = "${var.project_name}-${terraform.workspace}"
  cloudfront_url = module.cdn.cloudfront_domain_name

  # Dev includes localhost for local development; prod only has the CloudFront URL.
  frontend_urls = terraform.workspace == "dev" ? "http://localhost:4200,${local.cloudfront_url}" : local.cloudfront_url
}

# ---------------------------------------------------------------------------
# Frontend — S3 static site bucket + file uploads
# ---------------------------------------------------------------------------

module "frontend" {
  source = "../frontend/deploy/modules/s3_static_site"

  bucket_name   = "${local.name_prefix}-frontend"
  dist_path     = var.frontend_dist_path
  force_destroy = terraform.workspace != "prod"

  tags = {
    Component = "frontend"
  }
}

# ---------------------------------------------------------------------------
# Backend — Cognito, Lambda (private + public), API Gateway
# ---------------------------------------------------------------------------

module "cognito" {
  source = "../modules/cognito"

  name          = "${local.name_prefix}-backend"
  aws_region    = var.aws_region
  frontend_urls = local.frontend_urls

  tags = {
    Component = "backend"
  }
}

module "backend" {
  source = "../modules/lambda_express"

  name          = "${local.name_prefix}-backend"
  dist_zip_path = var.dist_zip_path
  aws_region    = var.aws_region
  mongodb_uri   = var.mongodb_uri

  tags = {
    Component = "backend"
  }
}

module "backend_public" {
  source = "../modules/lambda_express"

  name          = "${local.name_prefix}-backend-public"
  dist_zip_path = var.dist_zip_path
  aws_region    = var.aws_region
  mongodb_uri   = var.mongodb_uri

  # Cognito values are injected as plain env vars — identical to how local dev
  # reads them from .env. No SSM calls, no AWS SDK needed in the application.
  extra_env_vars = {
    COGNITO_ISSUER    = module.cognito.issuer_url
    COGNITO_CLIENT_ID = module.cognito.client_id
  }

  tags = {
    Component = "backend-public"
  }
}

module "api_gateway" {
  source = "../backend/deploy/modules/api_gateway"

  name                        = "${local.name_prefix}-backend"
  lambda_function_arn         = module.backend.function_arn
  lambda_function_name        = module.backend.function_name
  public_lambda_function_arn  = module.backend_public.function_arn
  public_lambda_function_name = module.backend_public.function_name
  cognito_issuer_url          = module.cognito.issuer_url
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_hosted_ui_domain    = module.cognito.hosted_ui_domain
  cognito_user_pool_client_id = module.cognito.client_id
  aws_region                  = var.aws_region
  frontend_urls               = local.frontend_urls

  tags = {
    Component = "backend"
  }
}

# ---------------------------------------------------------------------------
# CDN — CloudFront distribution
# ---------------------------------------------------------------------------

module "cdn" {
  source = "../cdn/deploy/modules/cloudfront"

  name            = "${local.name_prefix}-frontend"
  api_gateway_url = module.api_gateway.api_endpoint

  # Main S3 bucket origin.
  bucket_id                   = module.frontend.bucket_id
  bucket_arn                  = module.frontend.bucket_arn
  bucket_regional_domain_name = module.frontend.bucket_regional_domain_name

  tags = {
    Component = "cdn"
  }
}
