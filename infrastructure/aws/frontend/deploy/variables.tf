variable "aws_account_id" {
  description = "12-digit AWS account ID. Used by the provider's allowed_account_ids guard and in resource naming."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "aws_region" {
  description = "AWS region for all resources (e.g. \"eu-central-1\")."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Short lowercase identifier used as a prefix in all resource names."
  type        = string
  default     = "breadly"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-21 chars, starting with a letter."
  }
}

variable "frontend_dist_path" {
  description = "Path to the compiled Angular output directory. Every file found recursively will be uploaded to S3."
  type        = string
  default     = "../../../../breadly-frontend/dist/breadly-frontend/browser"
}
