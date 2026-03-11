# main.tf — root module entry point; wires together all child modules.

module "backend" {
  source = "./modules/lambda_express"

  name         = "${var.project_name}-${terraform.workspace}-backend"
  dist_zip_path = var.dist_zip_path
  aws_region   = var.aws_region

  tags = {
    Component = "backend"
  }
}
