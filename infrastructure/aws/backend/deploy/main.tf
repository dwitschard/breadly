# main.tf — root module entry point; wires together all child modules.
#
# Dependency order (no circular dependencies):
#   1. module.cognito       — Cognito User Pool + App Client. No Lambda dependency.
#                             Outputs issuer_url and client_id used by downstream modules.
#   2. module.backend       — Private Lambda (authenticated routes). Receives mongodb_uri.
#   3. module.backend_public — Public Lambda (unauthenticated /public/* routes).
#                              Receives COGNITO_ISSUER and COGNITO_CLIENT_ID as plain
#                              env vars from module.cognito — no SSM, no SDK needed.
#   4. module.api_gateway   — HTTP API + JWT authorizer. Receives both Lambda ARNs
#                              and Cognito values from the modules above.

module "cognito" {
  source = "./modules/cognito"

  name          = "${var.project_name}-${terraform.workspace}-backend"
  aws_region    = var.aws_region
  frontend_urls = var.frontend_urls

  tags = {
    Component = "backend"
  }
}

module "backend" {
  source = "./modules/lambda_express"

  name          = "${var.project_name}-${terraform.workspace}-backend"
  dist_zip_path = var.dist_zip_path
  aws_region    = var.aws_region
  mongodb_uri   = var.mongodb_uri

  tags = {
    Component = "backend"
  }
}

module "backend_public" {
  source = "./modules/lambda_express"

  name          = "${var.project_name}-${terraform.workspace}-backend-public"
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
  source = "./modules/api_gateway"

  name                        = "${var.project_name}-${terraform.workspace}-backend"
  lambda_function_arn         = module.backend.function_arn
  lambda_function_name        = module.backend.function_name
  public_lambda_function_arn  = module.backend_public.function_arn
  public_lambda_function_name = module.backend_public.function_name
  cognito_issuer_url          = module.cognito.issuer_url
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_user_pool_client_id = module.cognito.client_id
  aws_region                  = var.aws_region
  frontend_urls               = var.frontend_urls

  tags = {
    Component = "backend"
  }
}
