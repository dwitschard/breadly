# modules/api_gateway_routes/variables.tf

variable "api_gateway_id" {
  description = "ID of the shared API Gateway HTTP API."
  type        = string
}

variable "branch_slug" {
  description = "Slugified branch name used in route path and resource names."
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of the per-branch private Lambda function."
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the per-branch private Lambda function."
  type        = string
}

variable "public_lambda_function_arn" {
  description = "ARN of the per-branch public Lambda function."
  type        = string
}

variable "public_lambda_function_name" {
  description = "Name of the per-branch public Lambda function."
  type        = string
}

variable "cognito_issuer_url" {
  description = "OIDC issuer URL of the per-branch Cognito User Pool."
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "ID of the per-branch Cognito App Client."
  type        = string
}

variable "aws_region" {
  description = "AWS region."
  type        = string
}

variable "aws_account_id" {
  description = "12-digit AWS account ID. Used to scope Lambda permissions to the specific API Gateway."
  type        = string
}

variable "tags" {
  description = "Additional tags. Not directly applied to API Gateway resources (which don't support tags in the same way) but kept for consistency."
  type        = map(string)
  default     = {}
}
