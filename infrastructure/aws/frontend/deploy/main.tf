# main.tf — root module entry point; manages the S3 static site bucket.
# CloudFront is managed by the separate cdn/deploy root module.

module "frontend" {
  source = "./modules/s3_static_site"

  bucket_name   = "${var.project_name}-${terraform.workspace}-frontend"
  dist_path     = var.frontend_dist_path
  force_destroy = true

  tags = {
    Component = "frontend"
  }
}
