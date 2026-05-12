# providers.tf — dual-region provider configuration.
# Default region (eu-central-1) for SES, SSM, Route53.
# Aliased us-east-1 provider for ACM (CloudFront requirement).

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.12.0, < 7.0.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "global"
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias               = "us_east_1"
  region              = "us-east-1"
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "global"
      ManagedBy   = "terraform"
    }
  }
}
