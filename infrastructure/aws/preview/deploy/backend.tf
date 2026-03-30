# backend.tf — S3 remote state backend for preview environments.
# Uses the same dev state bucket as the main backend, with a different key prefix.
# Each branch gets its own Terraform workspace: preview-<slug>.

terraform {
  backend "s3" {
    bucket = ""

    # Workspace-aware key isolates each preview branch's state.
    key = "preview/terraform.tfstate"

    region         = ""
    encrypt        = true
    dynamodb_table = ""
  }
}
