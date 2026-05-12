# setup/providers.tf — Terraform and AWS provider configuration.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.75.0, < 6.0.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
      Module    = "setup"
    }
  }
}
