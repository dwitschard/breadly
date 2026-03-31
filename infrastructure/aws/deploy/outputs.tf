# outputs.tf — merged root module outputs.
# Combined outputs from frontend, backend, and CDN stacks.

# --- Frontend ---

output "frontend_bucket_id" {
  description = "Name of the S3 bucket hosting the frontend."
  value       = module.frontend.bucket_id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket."
  value       = module.frontend.bucket_arn
}

output "frontend_website_url" {
  description = "Public HTTP URL of the deployed frontend (S3 website endpoint)."
  value       = module.frontend.website_endpoint
}

output "frontend_bucket_regional_domain" {
  description = "Regional S3 domain name."
  value       = module.frontend.bucket_regional_domain_name
}

output "frontend_uploaded_file_count" {
  description = "Number of files synced to S3 in the last apply."
  value       = module.frontend.uploaded_file_count
}

# --- Backend ---

output "api_gateway_endpoint" {
  description = "Public HTTPS endpoint of the API Gateway HTTP API."
  value       = module.api_gateway.api_endpoint
}

output "api_gateway_id" {
  description = "ID of the shared API Gateway HTTP API. Used by the preview module to add per-branch routes."
  value       = module.api_gateway.api_id
}

output "cognito_issuer_url" {
  description = "OIDC issuer URL of the Cognito User Pool."
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

# --- CDN ---

output "cloudfront_url" {
  description = "HTTPS CloudFront URL (e.g. https://xxxxx.cloudfront.net)."
  value       = module.cdn.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidations."
  value       = module.cdn.cloudfront_distribution_id
}
