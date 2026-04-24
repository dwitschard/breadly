# outputs.tf — root module outputs for the preview deploy module.

output "preview_url" {
  description = "Full HTTPS URL of the preview environment frontend."
  value       = "${var.cloudfront_url}/preview/${var.branch_slug}/"
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "ID of the shared preview Cognito User Pool."
  value       = data.terraform_remote_state.gateway.outputs.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Client ID of the shared preview Cognito User Pool app client."
  value       = data.terraform_remote_state.gateway.outputs.cognito_client_id
}

output "cognito_hosted_ui_domain" {
  description = "Base URL of the shared preview Cognito Hosted UI."
  value       = data.terraform_remote_state.gateway.outputs.cognito_hosted_ui_domain
  sensitive   = true
}
