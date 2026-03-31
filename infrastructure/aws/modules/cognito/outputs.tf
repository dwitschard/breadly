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
  value       = "https://${aws_cognito_user_pool_domain.this.domain}.auth.${var.aws_region}.amazoncognito.com"
}
