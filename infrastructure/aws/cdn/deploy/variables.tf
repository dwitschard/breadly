# variables.tf — CDN root module input variables.

variable "aws_account_id" {
  description = "12-digit AWS account ID. Used by the provider's allowed_account_ids guard."
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

variable "preview_buckets" {
  description = "Map of active preview environments. Key = branch slug, value = object with S3 bucket details. Passed by the deploy/cleanup workflows after collecting outputs from all active preview workspaces."
  type = map(object({
    bucket_id                   = string
    bucket_arn                  = string
    bucket_regional_domain_name = string
  }))
  default = {}
}

variable "preview_only" {
  description = "When true, the distribution serves only preview environments (no main S3 origin). The API Gateway URL must be provided via api_gateway_url."
  type        = bool
  default     = false
}

variable "api_gateway_url" {
  description = "HTTPS URL of the API Gateway endpoint. When set, overrides the URL from backend remote state. Required when preview_only = true."
  type        = string
  default     = ""
}
