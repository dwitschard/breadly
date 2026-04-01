# modules/api_gateway/variables.tf — module input variables.

variable "name" {
  description = "Base name prefix used for all resources (e.g. breadly-dev-backend)."
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of the private Lambda function (authenticated routes)."
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the private Lambda function; used when granting API Gateway invoke permission."
  type        = string
}

variable "public_lambda_function_arn" {
  description = "ARN of the public Lambda function (unauthenticated /public/* routes)."
  type        = string
}

variable "public_lambda_function_name" {
  description = "Name of the public Lambda function; used when granting API Gateway invoke permission."
  type        = string
}

variable "cognito_issuer_url" {
  description = "OIDC issuer URL for the Cognito User Pool. Used by the JWT authorizer to validate Bearer tokens."
  type        = string
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool. Passed through as an output for operator reference."
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "ID of the Cognito App Client. Used as the JWT authorizer audience."
  type        = string
}

variable "cognito_hosted_ui_domain" {
  description = "Full Cognito Hosted UI domain URL. Passed through as an output for operator reference."
  type        = string
}

variable "aws_region" {
  description = "AWS region."
  type        = string
}

variable "frontend_urls" {
  description = "Comma-separated frontend URLs. Kept for symmetry with other modules; not used directly here — Cognito callback URLs are configured in the cognito module."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
