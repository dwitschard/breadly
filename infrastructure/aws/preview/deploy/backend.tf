# backend.tf — S3 remote state backend for preview environments.
# Uses the preview state bucket (breadly-preview-tfstate), supplied via -backend-config.
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
