# main.tf — root module entry point; wires together all child modules.

module "backend" {
  source = "./modules/lambda_express"

  name          = "${var.project_name}-${terraform.workspace}-backend"
  dist_zip_path = var.dist_zip_path
  aws_region    = var.aws_region

  tags = {
    Component = "backend"
  }
}

module "api_gateway" {
  source = "./modules/api_gateway"

  name                 = "${var.project_name}-${terraform.workspace}-backend"
  lambda_function_arn  = module.backend.function_arn
  lambda_function_name = module.backend.function_name
  aws_region           = var.aws_region
  admin_email          = var.admin_email
  frontend_urls        = var.frontend_urls

  tags = {
    Component = "backend"
  }
}
