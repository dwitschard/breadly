# main.tf — root module entry point; wires together all child modules.

module "frontend" {
  source = "./modules/s3_static_site"

  bucket_name   = "${var.project_name}-${terraform.workspace}-frontend"
  dist_path     = var.frontend_dist_path
  force_destroy = terraform.workspace != "prod"

  tags = {
    Component = "frontend"
  }
}
