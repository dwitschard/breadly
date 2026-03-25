# modules/cognito/variables.tf — module input variables.

variable "name" {
  description = "Base name prefix used for all resources (e.g. breadly-dev-backend)."
  type        = string
}

variable "aws_region" {
  description = "AWS region; used to construct the Cognito issuer URL."
  type        = string
}

variable "frontend_urls" {
  description = "Comma-separated frontend URLs for the Cognito App Client callback and logout lists (e.g. \"http://localhost:4200,https://example.com\"). All URLs are used as-is."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
