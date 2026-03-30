# variables.tf — root module input variables for the preview deploy module.

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

variable "branch_slug" {
  description = "Slugified branch name (lowercase, special chars replaced with hyphens, max 40 chars). Used as the URL path prefix and resource name suffix."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$", var.branch_slug))
    error_message = "branch_slug must be lowercase alphanumeric with hyphens, 2-40 chars, not starting or ending with a hyphen."
  }
}

variable "dist_zip_path" {
  description = "Absolute path to the backend.zip artifact produced by the build pipeline."
  type        = string
}

variable "mongodb_uri" {
  description = "MongoDB connection string for the private Lambda. Passed as the MONGODB_CONNECTION_STRING environment variable."
  type        = string
  sensitive   = true
}

variable "cloudfront_url" {
  description = "Base HTTPS URL of the shared CloudFront distribution (e.g. https://<id>.cloudfront.net). Used as the Cognito callback URL."
  type        = string
}
