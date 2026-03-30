# modules/cognito/main.tf — provisions a per-branch Cognito User Pool, App Client,
# and Hosted UI domain for preview environments.
#
# Mirrors the structure of the dev backend cognito module but accepts a single
# frontend_url string (not comma-separated) for simplicity.

locals {
  issuer_url = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

resource "aws_cognito_user_pool" "this" {
  name = var.name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "this" {
  name         = "${var.name}-client"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ]

  access_token_validity  = 1  # hours
  id_token_validity      = 1  # hours
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email"]
  supported_identity_providers         = ["COGNITO"]

  # Single preview URL — callback at /preview/<slug>/oidc-callback
  callback_urls = ["${var.frontend_urls}/oidc-callback"]
  logout_urls   = [var.frontend_urls]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = var.name
  user_pool_id = aws_cognito_user_pool.this.id
}
