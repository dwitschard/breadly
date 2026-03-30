# modules/cognito/variables.tf

variable "name" {
  description = "Base name prefix used for all resources (e.g. breadly-preview-feature-recipe-search-backend)."
  type        = string
}

variable "aws_region" {
  description = "AWS region; used to construct the Cognito issuer URL."
  type        = string
}

variable "frontend_urls" {
  description = "Single frontend URL for the preview environment (e.g. https://<cf>.cloudfront.net/preview/<slug>). Used as the Cognito App Client callback and logout URL."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
