# main.tf — root module entry point; wires together all child modules.

# Read the backend stack's remote state to get the API Gateway endpoint.
# This avoids the need for a manually-managed GitHub Actions variable and
# ensures the frontend is always wired to the correct API Gateway URL.
data "terraform_remote_state" "backend" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-${terraform.workspace}-tfstate"
    key    = "env:/${terraform.workspace}/backend/terraform.tfstate"
    region = var.aws_region
  }
}

module "frontend" {
  source = "./modules/s3_static_site"

  bucket_name   = "${var.project_name}-${terraform.workspace}-frontend"
  dist_path     = var.frontend_dist_path
  force_destroy = true

  tags = {
    Component = "frontend"
  }
}

module "cdn" {
  source = "./modules/cloudfront"

  name                        = "${var.project_name}-${terraform.workspace}-frontend"
  bucket_id                   = module.frontend.bucket_id
  bucket_arn                  = module.frontend.bucket_arn
  bucket_regional_domain_name = module.frontend.bucket_regional_domain_name
  api_gateway_url             = data.terraform_remote_state.backend.outputs.api_gateway_endpoint

  tags = {
    Component = "frontend"
  }
}
