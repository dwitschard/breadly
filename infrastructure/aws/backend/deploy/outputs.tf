# outputs.tf — root module outputs.

output "api_gateway_endpoint" {
  description = "Public HTTPS endpoint of the API Gateway HTTP API."
  value       = module.api_gateway.api_endpoint
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = module.api_gateway.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito App Client (needed by the frontend to authenticate users)."
  value       = module.api_gateway.cognito_user_pool_client_id
}

output "cognito_hosted_ui_domain" {
  description = "Base URL of the Cognito Hosted UI (needed for auth.config.ts logoutUrl)."
  value       = module.api_gateway.cognito_hosted_ui_domain
}
