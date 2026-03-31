# outputs.tf — root module outputs for the preview deploy module.

output "preview_url" {
  description = "Full HTTPS URL of the preview environment frontend."
  value       = "${var.cloudfront_url}/preview/${var.branch_slug}/"
}

output "cognito_user_pool_id" {
  description = "ID of the per-branch Cognito User Pool."
  value       = module.cognito.user_pool_id
}

output "cognito_hosted_ui_domain" {
  description = "Base URL of the per-branch Cognito Hosted UI."
  value       = module.cognito.hosted_ui_domain
}
