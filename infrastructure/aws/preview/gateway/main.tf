# main.tf — shared API Gateway, S3 bucket, and CloudFront distribution for all
# preview environments.
#
# Creates a single HTTP API that all preview branches add routes to.
# Creates a single shared S3 bucket for all preview frontend assets.
# Creates a CloudFront distribution with the API Gateway and S3 bucket as origins.
# No Cognito, no Lambda — those are per-branch resources managed by preview/deploy.
# Frontend files are uploaded by the workflow via `aws s3 sync`, not Terraform.

# ---------------------------------------------------------------------------
# SSM — read global outputs
# ---------------------------------------------------------------------------

data "aws_ssm_parameter" "hosted_zone_id" {
  name = "/${var.project_name}/global/hosted-zone-id"
}

data "aws_ssm_parameter" "certificate_arn" {
  name = "/${var.project_name}/global/certificate-arn"
}

data "aws_ssm_parameter" "app_domain" {
  name = "/${var.project_name}/global/app-domain"
}

data "aws_ssm_parameter" "domain_name" {
  name = "/${var.project_name}/global/domain-name"
}

data "aws_ssm_parameter" "oac_preview_id" {
  name = "/${var.project_name}/global/oac-preview-id"
}

locals {
  preview_domain      = "preview.${data.aws_ssm_parameter.app_domain.value}"
  domain_name         = data.aws_ssm_parameter.domain_name.value
  preview_auth_domain = "preview.auth.${local.domain_name}"
  preview_url         = "https://${local.preview_domain}"
}

# ---------------------------------------------------------------------------
# API Gateway
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project_name}-preview"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    allow_headers = ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 86400
  }

  tags = {
    Component = "preview-gateway"
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Component = "preview-gateway"
  }
}

# ---------------------------------------------------------------------------
# Shared S3 bucket for all preview frontend assets.
# Each preview stores files under a /<branch-slug>/ key prefix.
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "preview_frontend" {
  bucket        = "${var.project_name}-preview"
  force_destroy = true

  tags = {
    Component = "preview"
  }
}

resource "aws_s3_bucket_versioning" "preview_frontend" {
  bucket = aws_s3_bucket.preview_frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "preview_frontend" {
  bucket = aws_s3_bucket.preview_frontend.id

  # All public access is blocked — CloudFront OAC is the sole access path.
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true

  depends_on = [aws_s3_bucket.preview_frontend]
}

# ---------------------------------------------------------------------------
# CDN — CloudFront distribution for the preview environment.
# Serves preview frontend assets from the shared S3 bucket and routes
# /preview/*/api/* requests to the shared API Gateway.
# ---------------------------------------------------------------------------

module "cdn" {
  source = "../../modules/cloudfront"

  name         = "${var.project_name}-preview"
  preview_only = true

  api_gateway_url = aws_apigatewayv2_stage.default.invoke_url

  preview_bucket_id                   = aws_s3_bucket.preview_frontend.id
  preview_bucket_arn                  = aws_s3_bucket.preview_frontend.arn
  preview_bucket_regional_domain_name = aws_s3_bucket.preview_frontend.bucket_regional_domain_name

  # Custom domain configuration.
  domain_aliases      = [local.preview_domain]
  acm_certificate_arn = data.aws_ssm_parameter.certificate_arn.value

  # OAC from global stack.
  preview_oac_id = data.aws_ssm_parameter.oac_preview_id.value

  tags = {
    Component = "preview-cdn"
  }
}

# ---------------------------------------------------------------------------
# Route53 — DNS records for preview custom domain
# ---------------------------------------------------------------------------

resource "aws_route53_record" "preview_a" {
  zone_id = data.aws_ssm_parameter.hosted_zone_id.value
  name    = local.preview_domain
  type    = "A"

  alias {
    name                   = module.cdn.cloudfront_raw_domain_name
    zone_id                = module.cdn.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "preview_aaaa" {
  zone_id = data.aws_ssm_parameter.hosted_zone_id.value
  name    = local.preview_domain
  type    = "AAAA"

  alias {
    name                   = module.cdn.cloudfront_raw_domain_name
    zone_id                = module.cdn.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# ---------------------------------------------------------------------------
# Cognito — shared User Pool for all preview branches
# ---------------------------------------------------------------------------

module "cognito" {
  source = "../../modules/cognito"

  name                       = "${var.project_name}-preview"
  aws_region                 = var.aws_region
  # The gateway's App Client is not used by preview branches (each branch creates
  # its own client in preview/deploy). Keep a placeholder callback so the client
  # resource is valid; it will never receive actual OIDC redirects.
  frontend_urls              = local.preview_url
  custom_domain              = local.preview_auth_domain
  certificate_arn            = data.aws_ssm_parameter.certificate_arn.value
  ui_settings                = file("${path.module}/../../../../breadly-idp-ui/settings.json")
  ui_logo_png                = fileexists("${path.module}/../../../../breadly-idp-ui/logo.png") ? filebase64("${path.module}/../../../../breadly-idp-ui/logo.png") : ""
  ui_background_svg          = fileexists("${path.module}/../../../../breadly-idp-ui/background.svg") ? filebase64("${path.module}/../../../../breadly-idp-ui/background.svg") : ""

  tags = {
    Component = "preview-cognito"
  }
}

# ---------------------------------------------------------------------------
# Cognito — dedicated app client for localhost development
# ---------------------------------------------------------------------------
# Separate from the per-branch clients so localhost access is an explicit,
# auditable choice scoped only to this preview pool. Cognito enforces the
# callback URL strictly, so this client cannot be used from any other origin.

resource "aws_cognito_user_pool_client" "localhost" {
  name         = "${var.project_name}-preview-localhost-client"
  user_pool_id = module.cognito.user_pool_id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = ["http://localhost:4200/oidc-callback"]
  logout_urls   = ["http://localhost:4200"]
}

# ---------------------------------------------------------------------------
# Local development DynamoDB table — shared by all developers
# Mirrors the localhost Cognito app client pattern above: one-time resource,
# shared across all developer sessions on the same AWS account.
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "local_dev" {
  name         = "${var.project_name}-local"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Component = "local-dev"
  }
}

# DNS A record for the shared preview Cognito custom domain
resource "aws_route53_record" "cognito_a" {
  zone_id = data.aws_ssm_parameter.hosted_zone_id.value
  name    = local.preview_auth_domain
  type    = "A"

  alias {
    name                   = module.cognito.cognito_cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2" # Global CloudFront hosted zone ID
    evaluate_target_health = false
  }
}
