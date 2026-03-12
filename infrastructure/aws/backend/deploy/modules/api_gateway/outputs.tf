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
  value       = aws_cognito_user_pool.this.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito App Client (used by the frontend to authenticate)."
  value       = aws_cognito_user_pool_client.this.id
}
