# modules/cognito/main.tf — provisions a Cognito User Pool, App Client, and Hosted UI
# domain for the Breadly application.
#
# Used by both the main backend and preview environments. Preview environments
# set enable_admin_password_auth = true to allow programmatic E2E authentication

locals {
  # OIDC issuer URL — used by the JWT authorizer and injected into the public Lambda.
  issuer_url = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"

  # Parse the comma-separated frontend_urls string into a list, dropping any
  # blank entries that result from an empty variable value, and trimming
  # whitespace from each entry to avoid Cognito validation errors.
  frontend_callback_urls = [for url in compact(split(",", var.frontend_urls)) : trimspace(url)]
}

resource "aws_cognito_user_pool" "this" {
  name = var.name

  # Ensure Terraform destroys the domains and waits for propagation before
  # deleting the pool. Without this, Cognito rejects deletion with
  # "User pool cannot be deleted. It has a domain configured."
  depends_on = [time_sleep.wait_for_domain_delete]

  # Require email as the sign-in attribute.
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

  # Send verification codes and invitations via Cognito's built-in email (free tier).
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "this" {
  name         = "${var.name}-client"
  user_pool_id = aws_cognito_user_pool.this.id

  # SPA / mobile client — no client secret (public client).
  generate_secret = false

  # Allow the standard auth flows used by Amplify / hosted UI.
  # Preview environments additionally enable ALLOW_USER_PASSWORD_AUTH (for E2E
  # programmatic login via InitiateAuth) and ALLOW_ADMIN_USER_PASSWORD_AUTH
  # (for admin-set-user-password).
  explicit_auth_flows = concat(
    [
      "ALLOW_USER_SRP_AUTH",
      "ALLOW_REFRESH_TOKEN_AUTH",
    ],
    var.enable_admin_password_auth ? ["ALLOW_ADMIN_USER_PASSWORD_AUTH", "ALLOW_USER_PASSWORD_AUTH"] : []
  )

  # Token validity.
  access_token_validity  = 1  # hours
  id_token_validity      = 1  # hours
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Enable OAuth2 / OIDC authorization code flow (required for PKCE).
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = [for url in local.frontend_callback_urls : "${url}/oidc-callback"]
  logout_urls   = local.frontend_callback_urls
}

# ---------------------------------------------------------------------------
# Destroy-time delay — Cognito custom domain deletion can be asynchronous
# (especially for custom domains backed by CloudFront). This sleep ensures the
# domain is fully removed before Terraform attempts to delete the user pool.
# ---------------------------------------------------------------------------

resource "time_sleep" "wait_for_domain_delete" {
  destroy_duration = "30s"

  depends_on = [
    aws_cognito_user_pool_domain.this,
    aws_cognito_user_pool_domain.custom,
  ]
}

# Cognito Hosted UI domain — required to expose the /oauth2/authorize and
# /oauth2/token endpoints used by the PKCE authorization code flow.
# When custom_domain is set, uses the custom domain with an ACM certificate.
# Otherwise, uses the prefix domain: <var.name>.auth.<region>.amazoncognito.com
resource "aws_cognito_user_pool_domain" "this" {
  count = var.custom_domain != "" ? 0 : 1

  domain       = var.name
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_cognito_user_pool_domain" "custom" {
  count = var.custom_domain != "" ? 1 : 0

  domain          = var.custom_domain
  certificate_arn = var.certificate_arn
  user_pool_id    = aws_cognito_user_pool.this.id
}
