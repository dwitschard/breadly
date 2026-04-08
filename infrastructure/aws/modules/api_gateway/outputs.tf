# modules/api_gateway/outputs.tf — module outputs.

output "api_endpoint" {
  description = "Base URL of the HTTP API (includes the $default stage)."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_id" {
  description = "ID of the HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = var.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito App Client."
  value       = var.cognito_user_pool_client_id
}

output "cognito_hosted_ui_domain" {
  description = "Passed through from the cognito module for operator convenience."
  value       = var.cognito_hosted_ui_domain
}
