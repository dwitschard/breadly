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
  description = "Comma-separated frontend URLs for the Cognito App Client callback and logout lists (e.g. \"http://localhost:4200,https://example.com\"). A single URL is also valid."
  type        = string
  default     = ""
}

variable "enable_admin_password_auth" {
  description = "Enable ALLOW_ADMIN_USER_PASSWORD_AUTH flow. Set to true for preview environments where test users are created programmatically."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
