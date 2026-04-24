# outputs.tf — preview gateway root module outputs.

output "api_gateway_id" {
  description = "ID of the shared preview API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "api_gateway_endpoint" {
  description = "Public HTTPS endpoint of the preview API Gateway."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "preview_bucket_id" {
  description = "Name of the shared S3 bucket for all preview frontend assets."
  value       = aws_s3_bucket.preview_frontend.id
}

output "preview_bucket_arn" {
  description = "ARN of the shared preview frontend S3 bucket."
  value       = aws_s3_bucket.preview_frontend.arn
}

output "preview_bucket_regional_domain_name" {
  description = "Regional S3 domain name for CloudFront origin configuration."
  value       = aws_s3_bucket.preview_frontend.bucket_regional_domain_name
}

output "cloudfront_url" {
  description = "HTTPS URL of the preview CloudFront distribution (custom domain)."
  value       = "https://${local.preview_domain}"
  sensitive   = true
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID; used for cache invalidations."
  value       = module.cdn.cloudfront_distribution_id
}

output "cognito_issuer_url" {
  description = "OIDC issuer URL for the shared preview Cognito pool."
  value       = module.cognito.issuer_url
}

output "cognito_client_id" {
  description = "App Client ID for the shared preview Cognito pool."
  value       = module.cognito.client_id
}

output "cognito_hosted_ui_domain" {
  description = "Hosted UI base URL for the shared preview Cognito pool."
  value       = module.cognito.hosted_ui_domain
}

output "cognito_user_pool_id" {
  description = "User Pool ID for the shared preview Cognito pool."
  value       = module.cognito.user_pool_id
}
