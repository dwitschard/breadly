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
# SSM — read global outputs
# ---------------------------------------------------------------------------

data "aws_ssm_parameter" "hosted_zone_id" {
  name = "/${var.project_name}/global/hosted-zone-id"
}

data "aws_ssm_parameter" "certificate_arn" {
  name = "/${var.project_name}/global/certificate-arn"
}

data "aws_ssm_parameter" "ses_send_policy_arn" {
  name = "/${var.project_name}/global/ses-send-policy-arn"
}

data "aws_ssm_parameter" "app_domain" {
  name = "/${var.project_name}/global/app-domain"
}

data "aws_ssm_parameter" "domain_name" {
  name = "/${var.project_name}/global/domain-name"
}

data "aws_ssm_parameter" "ses_config_set" {
  name = "/${var.project_name}/global/ses-config-set-${terraform.workspace == "prod" ? "prod" : "dev"}"
}

data "aws_ssm_parameter" "oac_main_id" {
  name = "/${var.project_name}/global/oac-main-id"
}

data "aws_ssm_parameter" "appdock_hosted_zone_id" {
  name = "/${var.project_name}/global/appdock-hosted-zone-id"
}

data "aws_ssm_parameter" "appdock_certificate_arn" {
  name = "/${var.project_name}/global/appdock-certificate-arn"
}

# ---------------------------------------------------------------------------
# Locals
# ---------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-${terraform.workspace}"

  app_domain = data.aws_ssm_parameter.app_domain.value
  domain_name = data.aws_ssm_parameter.domain_name.value

  # Workspace-based domain mapping
  env_domain = terraform.workspace == "prod" ? local.app_domain : "${terraform.workspace}.${local.app_domain}"

  # Custom domain aliases for CloudFront
  domain_aliases = [local.env_domain]

  cloudfront_url = "https://${local.env_domain}"

  # Dev includes localhost for local development; prod only has the custom domain URL.
  frontend_urls = terraform.workspace == "dev" ? "http://localhost:4200,${local.cloudfront_url}" : local.cloudfront_url

  # SES sender email per environment
  ses_sender_email       = "noreply@${terraform.workspace == "prod" ? local.domain_name : "${terraform.workspace}.${local.domain_name}"}"
  ses_configuration_set  = data.aws_ssm_parameter.ses_config_set.value

  # Cognito custom domain (workspace-specific)
  auth_domain      = "auth.${local.domain_name}"
  cognito_custom_domain  = terraform.workspace == "prod" ? local.auth_domain : "${terraform.workspace}.${local.auth_domain}"
  cognito_certificate_arn = data.aws_ssm_parameter.certificate_arn.value

  # Storybook domain on appdock.ch (shared platform domain)
  storybook_domain = terraform.workspace == "prod" ? "storybook.appdock.ch" : "storybook.${terraform.workspace}.appdock.ch"
}

# ---------------------------------------------------------------------------
# Frontend — S3 static site bucket + file uploads
# ---------------------------------------------------------------------------

module "frontend" {
  source = "../modules/s3_static_site"

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

  name            = local.name_prefix
  aws_region      = var.aws_region
  frontend_urls   = local.frontend_urls
  custom_domain   = local.cognito_custom_domain
  certificate_arn = local.cognito_certificate_arn
  ui_settings     = file("${path.module}/../../../breadly-idp-ui/settings.json")
  ui_logo_png     = fileexists("${path.module}/../../../breadly-idp-ui/logo.png") ? filebase64("${path.module}/../../../breadly-idp-ui/logo.png") : ""
  ui_background_svg = fileexists("${path.module}/../../../breadly-idp-ui/background.svg") ? filebase64("${path.module}/../../../breadly-idp-ui/background.svg") : ""

  tags = {
    Component = "backend"
  }
}

# ---------------------------------------------------------------------------
# DynamoDB — user data table (settings, reminder shadow records)
# ---------------------------------------------------------------------------

resource "aws_dynamodb_table" "user_data" {
  name         = "${local.name_prefix}"
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
    Component = "backend"
  }
}

data "aws_iam_policy_document" "dynamodb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:DescribeTable",
    ]
    resources = [aws_dynamodb_table.user_data.arn]
  }
}

resource "aws_iam_policy" "dynamodb" {
  name   = "${local.name_prefix}-dynamodb-policy"
  policy = data.aws_iam_policy_document.dynamodb.json

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

  extra_env_vars = {
    SCHEDULER_GROUP_NAME  = module.scheduler.schedule_group_name
    SCHEDULER_ROLE_ARN    = module.scheduler.scheduler_role_arn
    API_GATEWAY_ENDPOINT  = module.api_gateway.api_arn
    SES_SENDER_EMAIL      = local.ses_sender_email
    SES_CONFIGURATION_SET = local.ses_configuration_set
    APP_URL               = local.cloudfront_url
    ENV_NAME              = terraform.workspace
    COGNITO_USERINFO_URL  = "${module.cognito.hosted_ui_domain}/oauth2/userInfo"
    DYNAMODB_TABLE_NAME   = aws_dynamodb_table.user_data.name
  }

  extra_policy_arns = {
    ses       = data.aws_ssm_parameter.ses_send_policy_arn.value,
    scheduler = module.scheduler.lambda_manage_schedules_policy_arn,
    dynamodb  = aws_iam_policy.dynamodb.arn,
  }

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

  extra_env_vars = {
    COGNITO_ISSUER    = module.cognito.issuer_url
    COGNITO_CLIENT_ID = module.cognito.client_id
    ENV_NAME          = terraform.workspace
  }

  tags = {
    Component = "backend-public"
  }
}

module "api_gateway" {
  source = "../modules/api_gateway"

  name                        = local.name_prefix
  lambda_function_arn         = module.backend.function_arn
  lambda_function_name        = module.backend.function_name
  public_lambda_function_arn  = module.backend_public.function_arn
  public_lambda_function_name = module.backend_public.function_name
  cognito_issuer_url          = module.cognito.issuer_url
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_hosted_ui_domain    = module.cognito.hosted_ui_domain
  cognito_user_pool_client_id = module.cognito.client_id
  frontend_urls               = local.frontend_urls

  tags = {
    Component = "backend"
  }
}

# ---------------------------------------------------------------------------
# Scheduler — EventBridge Scheduler for recurring and one-time schedules
# ---------------------------------------------------------------------------

module "scheduler" {
  source = "../modules/scheduler"

  name                      = local.name_prefix
  group_name                = "${local.name_prefix}-schedules"
  config_json         = file("${path.module}/../../../breadly-backend/config/schedules.json")
  lambda_function_arn = module.backend.function_arn

  tags = {
    Component = "scheduler"
  }
}

# ---------------------------------------------------------------------------
# Admin Alerts — CloudWatch alarm + SNS email for scheduler failures
# ---------------------------------------------------------------------------

resource "aws_ssm_parameter" "admin_notification_email" {
  name  = "/${var.project_name}/${terraform.workspace}/admin-notification-email"
  type  = "SecureString"
  value = var.admin_notification_email

  tags = { Component = "scheduler" }
}

resource "aws_sns_topic" "scheduler_alerts" {
  name = "${local.name_prefix}-scheduler-alerts"
  tags = { Component = "scheduler" }
}

# Requires one-time manual confirmation click after the first deploy.
resource "aws_sns_topic_subscription" "admin_email" {
  topic_arn = aws_sns_topic.scheduler_alerts.arn
  protocol  = "email"
  endpoint  = var.admin_notification_email
}

resource "aws_cloudwatch_metric_alarm" "scheduler_dropped" {
  alarm_name          = "${local.name_prefix}-scheduler-invocation-dropped"
  alarm_description   = "EventBridge Scheduler dropped an invocation after exhausting all retries."
  namespace           = "AWS/Scheduler"
  metric_name         = "InvocationDroppedCount"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ScheduleGroup = module.scheduler.schedule_group_name
  }

  alarm_actions = [aws_sns_topic.scheduler_alerts.arn]
  ok_actions    = []

  tags = { Component = "scheduler" }
}

# ---------------------------------------------------------------------------
# CDN — CloudFront distribution with custom domain
# ---------------------------------------------------------------------------

module "cdn" {
  source = "../modules/cloudfront"

  name            = local.name_prefix
  api_gateway_url = module.api_gateway.api_endpoint

  # Main S3 bucket origin.
  bucket_id                   = module.frontend.bucket_id
  bucket_arn                  = module.frontend.bucket_arn
  bucket_regional_domain_name = module.frontend.bucket_regional_domain_name

  # Custom domain configuration.
  domain_aliases      = local.domain_aliases
  acm_certificate_arn = data.aws_ssm_parameter.certificate_arn.value

  # OAC from global stack.
  oac_id = data.aws_ssm_parameter.oac_main_id.value

  tags = {
    Component = "cdn"
  }
}

# ---------------------------------------------------------------------------
# Route53 — DNS records for custom domain aliases
# ---------------------------------------------------------------------------

resource "aws_route53_record" "app_a" {
  zone_id         = data.aws_ssm_parameter.hosted_zone_id.value
  name            = local.env_domain
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = module.cdn.cloudfront_raw_domain_name
    zone_id                = module.cdn.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "app_aaaa" {
  zone_id         = data.aws_ssm_parameter.hosted_zone_id.value
  name            = local.env_domain
  type            = "AAAA"
  allow_overwrite = true

  alias {
    name                   = module.cdn.cloudfront_raw_domain_name
    zone_id                = module.cdn.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# Cognito custom domain DNS record (A record only, no AAAA)
resource "aws_route53_record" "cognito_a" {
  zone_id         = data.aws_ssm_parameter.hosted_zone_id.value
  name            = local.cognito_custom_domain
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = module.cognito.cognito_cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2" # Global CloudFront hosted zone ID
    evaluate_target_health = false
  }
}

# ---------------------------------------------------------------------------
# Storybook — S3 bucket + CloudFront + Route53 on appdock.ch
#
# The design system is shared across all appdock.ch applications.
# ---------------------------------------------------------------------------

module "storybook" {
  source = "../modules/s3_static_site"

  bucket_name   = "${local.name_prefix}-storybook"
  dist_path     = var.storybook_dist_path
  force_destroy = terraform.workspace != "prod"

  tags = {
    Component = "storybook"
  }
}

data "aws_iam_policy_document" "storybook_oac" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.storybook.bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.storybook.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "storybook" {
  bucket = module.storybook.bucket_id
  policy = data.aws_iam_policy_document.storybook_oac.json
}

resource "aws_cloudfront_distribution" "storybook" {
  comment         = "${local.name_prefix}-storybook"
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_100"
  aliases         = [local.storybook_domain]

  origin {
    domain_name              = module.storybook.bucket_regional_domain_name
    origin_id                = "s3-storybook"
    origin_access_control_id = data.aws_ssm_parameter.oac_main_id.value
  }

  default_root_object = "index.html"

  default_cache_behavior {
    target_origin_id       = "s3-storybook"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Storybook uses client-side routing for story navigation; return index.html
  # for any 403 (object not found in S3 via OAC) so deep links work.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_ssm_parameter.appdock_certificate_arn.value
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Component = "storybook"
  }
}

resource "aws_route53_record" "storybook_a" {
  zone_id = data.aws_ssm_parameter.appdock_hosted_zone_id.value
  name    = local.storybook_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.storybook.domain_name
    zone_id                = aws_cloudfront_distribution.storybook.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "storybook_aaaa" {
  zone_id = data.aws_ssm_parameter.appdock_hosted_zone_id.value
  name    = local.storybook_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.storybook.domain_name
    zone_id                = aws_cloudfront_distribution.storybook.hosted_zone_id
    evaluate_target_health = false
  }
}
