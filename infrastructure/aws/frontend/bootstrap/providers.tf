# ─────────────────────────────────────────────────────────────────────────────
# bootstrap/providers.tf
#
# Provider configuration for the one-time bootstrap root module.
#
# This root does NOT assume an IAM role — it must be run with credentials
# that have broad enough permissions to create IAM resources (OIDC provider,
# IAM role), the S3 state bucket, and the DynamoDB lock table.
#
# After bootstrap has run once, all subsequent deployments use the narrower
# BreadlyGitHubDeploy role via OIDC (frontend/ root).
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

provider "aws" {
  region = var.aws_region

  # Restrict operations to the explicitly configured account to prevent
  # accidental deployments to the wrong account.
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
      Module    = "bootstrap"
    }
  }
}
