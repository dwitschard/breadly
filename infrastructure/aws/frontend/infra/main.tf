# ─────────────────────────────────────────────────────────────────────────────
# main.tf  (root module)
#
# Entry point for the frontend infrastructure deployment.
# This file wires together all modules and passes workspace-aware values so
# that the same code deploys correctly to both dev and prod.
#
# Workflow
# ────────
# 1. Select (or create) a workspace:
#      terraform workspace select dev   # or prod
#
# 2. Run plan/apply with the matching .tfvars file:
#      terraform plan  -var-file=envs/dev.tfvars
#      terraform apply -var-file=envs/dev.tfvars
#
# 3. To deploy to production:
#      terraform workspace select prod
#      terraform apply -var-file=envs/prod.tfvars
#
# Extending this configuration
# ─────────────────────────────
# Add new modules below this one using the same pattern:
#
#   module "api_ecs" {
#     source = "./modules/ecs_service"
#     ...
#   }
#
# Each module in ./modules/ is self-contained and reusable across root modules.
# ─────────────────────────────────────────────────────────────────────────────

# ── Frontend S3 static website ────────────────────────────────────────────────

module "frontend" {
  source = "./modules/s3_static_site"

  # Bucket name is scoped to workspace so dev and prod never share a bucket.
  # Pattern: <project>-<workspace>-frontend
  # Examples: breadly-dev-frontend, breadly-prod-frontend
  bucket_name = "${var.project_name}-${terraform.workspace}-frontend"

  # Path to the compiled Angular output.  Provided as a root-module variable
  # so CI/CD pipelines can supply an absolute path via -var or the .tfvars file.
  dist_path = var.frontend_dist_path

  index_document = var.index_document
  error_document = var.error_document

  # Allow `terraform destroy` to empty the bucket in non-prod environments.
  # In production this is false to protect against accidental deletion.
  force_destroy = terraform.workspace != "prod"

  tags = {
    Component = "frontend"
  }
}
