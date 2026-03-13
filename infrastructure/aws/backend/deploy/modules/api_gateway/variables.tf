# modules/api_gateway/variables.tf — module input variables.

variable "name" {
  description = "Base name prefix used for all resources (e.g. breadly-dev-backend)."
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of the Lambda function to proxy requests to."
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function; used when granting API Gateway invoke permission."
  type        = string
}

variable "aws_region" {
  description = "AWS region; used to construct the Cognito issuer URL."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}

variable "admin_email" {
  description = "Email address of the admin user. Terraform creates a placeholder Cognito user; run scripts/setup-users.ts to activate it with a real password."
  type        = string
}
