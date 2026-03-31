# main.tf — CDN root module. Provisions a CloudFront distribution.
#
# Standard mode (dev/prod): backed by a main S3 bucket (from frontend state)
# and API Gateway (from backend state), with optional preview bucket origins.
#
# Preview-only mode (preview_only = true): no main S3 origin. Only the API
# Gateway origin and per-preview S3 bucket origins. The API Gateway URL is
# passed directly via the api_gateway_url variable.

# ---------------------------------------------------------------------------
# Remote state — only needed in standard mode (dev/prod)
# ---------------------------------------------------------------------------

data "terraform_remote_state" "frontend" {
  count   = var.preview_only ? 0 : 1
  backend = "s3"
  config = {
    bucket = "${var.project_name}-${terraform.workspace}-tfstate"
    key    = "env:/${terraform.workspace}/frontend/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "backend" {
  count   = var.preview_only ? 0 : 1
  backend = "s3"
  config = {
    bucket = "${var.project_name}-${terraform.workspace}-tfstate"
    key    = "env:/${terraform.workspace}/backend/terraform.tfstate"
    region = var.aws_region
  }
}

module "cdn" {
  source = "./modules/cloudfront"

  name            = "${var.project_name}-${terraform.workspace}-frontend"
  preview_only    = var.preview_only
  api_gateway_url = var.preview_only ? var.api_gateway_url : data.terraform_remote_state.backend[0].outputs.api_gateway_endpoint
  preview_buckets = var.preview_buckets

  # Main S3 bucket — only used in standard mode.
  bucket_id                   = var.preview_only ? "" : data.terraform_remote_state.frontend[0].outputs.frontend_bucket_id
  bucket_arn                  = var.preview_only ? "" : data.terraform_remote_state.frontend[0].outputs.frontend_bucket_arn
  bucket_regional_domain_name = var.preview_only ? "" : data.terraform_remote_state.frontend[0].outputs.frontend_bucket_regional_domain

  tags = {
    Component = "cdn"
  }
}
