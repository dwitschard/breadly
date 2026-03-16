# main.tf — root module entry point; wires together all child modules.

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

  tags = {
    Component = "frontend"
  }
}
