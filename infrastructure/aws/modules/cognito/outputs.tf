# modules/cognito/outputs.tf — module outputs.

output "user_pool_id" {
  description = "ID of the Cognito User Pool."
  value       = aws_cognito_user_pool.this.id
}

output "client_id" {
  description = "ID of the Cognito App Client (used by the frontend to authenticate)."
  value       = aws_cognito_user_pool_client.this.id
}

output "issuer_url" {
  description = "OIDC issuer URL (https://cognito-idp.<region>.amazonaws.com/<user_pool_id>). Injected into the public Lambda as COGNITO_ISSUER."
  value       = local.issuer_url
}

output "hosted_ui_domain" {
  description = "Base URL of the Cognito Hosted UI (needed for OIDC logout redirect)."
  value       = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${aws_cognito_user_pool_domain.this[0].domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "cognito_cloudfront_domain" {
  description = "CloudFront domain name backing the custom Cognito domain. Empty when using prefix domain."
  value       = var.custom_domain != "" ? aws_cognito_user_pool_domain.custom[0].cloudfront_distribution : ""
}
