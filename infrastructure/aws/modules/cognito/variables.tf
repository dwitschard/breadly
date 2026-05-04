# modules/cognito/variables.tf — module input variables.

variable "name" {
  description = "Base name prefix used for all resources (e.g. breadly-dev)."
  type        = string
}

variable "aws_region" {
  description = "AWS region; used to construct the Cognito issuer URL."
  type        = string
}

variable "frontend_urls" {
  description = "Comma-separated frontend URLs for the Cognito App Client callback and logout lists (e.g. \"http://localhost:4200,https://example.com\"). A single URL is also valid."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}

variable "custom_domain" {
  description = "Custom domain for the Cognito Hosted UI (e.g. auth.example.com). When empty, uses the prefix domain."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain. Required when custom_domain is set."
  type        = string
  default     = ""
}
