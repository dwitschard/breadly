# outputs.tf — root module outputs.

output "api_gateway_endpoint" {
  description = "Public HTTPS endpoint of the API Gateway HTTP API."
  value       = module.api_gateway.api_endpoint
}

output "api_gateway_id" {
  description = "ID of the shared API Gateway HTTP API. Used by the preview module to add per-branch routes."
  value       = module.api_gateway.api_id
}

output "cognito_issuer_url" {
  description = "OIDC issuer URL of the dev Cognito User Pool. Used by the preview module to reference the shared backend state."
  value       = module.cognito.issuer_url
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
