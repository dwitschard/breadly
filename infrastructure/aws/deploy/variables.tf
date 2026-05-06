# variables.tf — merged root module input variables.
# Union of frontend, backend, and CDN variables. The frontend_urls variable is
# eliminated — it is now computed internally from the CloudFront domain.

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

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-21 chars, starting with a letter."
  }
}

variable "dist_zip_path" {
  description = "Absolute path to the backend.zip artifact produced by the build pipeline."
  type        = string
}

variable "frontend_dist_path" {
  description = "Path to the compiled Angular output directory. Every file found recursively will be uploaded to S3."
  type        = string
}

variable "storybook_dist_path" {
  description = "Path to the compiled Storybook output directory (storybook-static/). Every file found recursively will be uploaded to S3."
  type        = string
}

variable "mongodb_uri" {
  description = "MongoDB connection string for the private Lambda. Passed as the MONGODB_CONNECTION_STRING environment variable. Set via the MONGODB_URI GitHub Actions secret."
  type        = string
  sensitive   = true
}

variable "admin_notification_email" {
  description = "Email address for admin failure notifications. Set via ADMIN_NOTIFICATION_EMAIL GitHub Secret."
  type        = string
  sensitive   = true
}
