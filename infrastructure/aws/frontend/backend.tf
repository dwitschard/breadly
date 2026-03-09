# ─────────────────────────────────────────────────────────────────────────────
# backend.tf
#
# Configures the Terraform remote state backend.
#
# Why S3 + DynamoDB?
# ──────────────────
# • S3 stores the state file durably and provides versioning so you can roll
#   back to any previous state snapshot.
# • DynamoDB provides a distributed lock (via a single-item table) that
#   prevents two concurrent `terraform apply` runs from corrupting the state.
#
# Bootstrap note
# ──────────────
# The S3 bucket and DynamoDB table referenced here must exist *before*
# running `terraform init`.  They are intentionally managed outside this
# configuration (e.g. created once manually or via a separate "bootstrap"
# Terraform root) so that we avoid a chicken-and-egg problem.
#
# Recommended bucket name convention:
#   <account-id>-<project>-tfstate
# Recommended DynamoDB table name:
#   <project>-tfstate-lock
#
# All backend configuration values are supplied at init time via -backend-config
# flags so that no account-specific values are hardcoded in source control.
#
# CI (GitHub Actions):
#   Secrets TF_STATE_BUCKET, TF_LOCK_TABLE, and AWS_REGION are injected
#   automatically by the deploy-frontend.yml workflow.
#
# Local development:
#   terraform init \
#     -backend-config="bucket=123456789012-breadly-tfstate" \
#     -backend-config="dynamodb_table=breadly-tfstate-lock" \
#     -backend-config="region=eu-central-1"
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  backend "s3" {
    # bucket, region, and dynamodb_table are intentionally empty.
    # They are always supplied via -backend-config flags (see above).
    # Terraform treats empty strings as unset and the -backend-config flags
    # always take precedence.

    bucket = ""

    # Path inside the bucket — workspace-aware key keeps envs isolated.
    # terraform.workspace resolves to "dev" or "prod" at runtime:
    #   env:/<workspace>/frontend/terraform.tfstate
    key = "frontend/terraform.tfstate"

    region = ""

    # Enable server-side encryption for the state file.
    encrypt = true

    dynamodb_table = ""
  }
}
