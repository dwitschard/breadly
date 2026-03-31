# main.tf — CDN root module. Provisions a CloudFront distribution backed by the
# S3 static site bucket (from frontend state) and API Gateway (from backend state).
#
# This module owns the CloudFront distribution, OAC, and S3 bucket policy.
# The S3 bucket itself is managed by the frontend deploy module.

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
