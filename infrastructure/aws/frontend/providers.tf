# ─────────────────────────────────────────────────────────────────────────────
# providers.tf
#
# Declares the required Terraform and provider versions, and configures the
# AWS provider.  The provider is intentionally parameterised so that the same
# code base can be pointed at any AWS account simply by changing the variables
# (or the corresponding .tfvars file / CI environment).
#
# Account linking strategy
# ────────────────────────
# When `var.aws_role_arn` is set (non-empty), the provider assumes that IAM
# role before performing any API call.  This is the recommended pattern for
# cross-account deployments and CI/CD pipelines: the pipeline runner holds
# minimal credentials and assumes a deployment role that carries only the
# permissions required by this Terraform configuration.
#
# When `var.aws_role_arn` is left empty the provider uses the credentials
# that are available in the current environment (env vars, ~/.aws/credentials,
# instance profile, etc.).
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ── AWS provider ──────────────────────────────────────────────────────────────

provider "aws" {
  region = var.aws_region

  # Restrict operations to the explicitly configured account to prevent
  # accidental deployments to the wrong account.
  allowed_account_ids = [var.aws_account_id]

  # Conditionally assume a deployment role.
  # The dynamic block is only rendered when an ARN is provided.
  dynamic "assume_role" {
    for_each = var.aws_role_arn != "" ? [var.aws_role_arn] : []

    content {
      role_arn     = assume_role.value
      session_name = "terraform-${var.project_name}-${terraform.workspace}"
    }
  }

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = terraform.workspace
      ManagedBy   = "terraform"
    }
  }
}
