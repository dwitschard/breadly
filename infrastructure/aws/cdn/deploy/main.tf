# main.tf — CDN root module. Provisions a CloudFront distribution.
#
# Standard mode (dev/prod): backed by a main S3 bucket (from frontend state)
# and API Gateway (from backend state). Also includes the shared preview S3
# bucket origin if the deploy state provides preview bucket details.
#
# Preview-only mode (preview_only = true): no main S3 origin. Only the API
# Gateway origin and shared preview S3 bucket origin. Both the API Gateway URL
# and preview bucket details are read from the gateway remote state.

# ---------------------------------------------------------------------------
# Remote state — standard mode reads deploy state, preview mode reads gateway
# ---------------------------------------------------------------------------

data "terraform_remote_state" "deploy" {
  count   = var.preview_only ? 0 : 1
  backend = "s3"
  config = {
    bucket = "${var.project_name}-${terraform.workspace}-tfstate"
    key    = "env:/${terraform.workspace}/deploy/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "gateway" {
  count   = var.preview_only ? 1 : 0
  backend = "s3"
  config = {
    bucket = "${var.project_name}-preview-tfstate"
    key    = "env:/preview/gateway/terraform.tfstate"
    region = var.aws_region
  }
}

module "cdn" {
  source = "./modules/cloudfront"

  name         = "${var.project_name}-${terraform.workspace}-frontend"
  preview_only = var.preview_only

  # API Gateway URL — from deploy state (standard) or gateway state (preview).
  api_gateway_url = var.preview_only ? data.terraform_remote_state.gateway[0].outputs.api_gateway_endpoint : data.terraform_remote_state.deploy[0].outputs.api_gateway_endpoint

  # Main S3 bucket — only used in standard mode.
  bucket_id                   = var.preview_only ? "" : data.terraform_remote_state.deploy[0].outputs.frontend_bucket_id
  bucket_arn                  = var.preview_only ? "" : data.terraform_remote_state.deploy[0].outputs.frontend_bucket_arn
  bucket_regional_domain_name = var.preview_only ? "" : data.terraform_remote_state.deploy[0].outputs.frontend_bucket_regional_domain

  # Shared preview S3 bucket — from gateway state (preview mode).
  preview_bucket_id                   = var.preview_only ? data.terraform_remote_state.gateway[0].outputs.preview_bucket_id : ""
  preview_bucket_arn                  = var.preview_only ? data.terraform_remote_state.gateway[0].outputs.preview_bucket_arn : ""
  preview_bucket_regional_domain_name = var.preview_only ? data.terraform_remote_state.gateway[0].outputs.preview_bucket_regional_domain_name : ""

  tags = {
    Component = "cdn"
  }
}
