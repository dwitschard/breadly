# providers.tf — AWS provider configuration for the preview root module.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region             = var.aws_region
  allowed_account_ids = [var.aws_account_id]
}
