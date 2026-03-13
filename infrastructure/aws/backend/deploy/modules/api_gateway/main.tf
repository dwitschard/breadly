# modules/api_gateway/main.tf — provisions an API Gateway HTTP API with a Cognito JWT
# authorizer in front of the Lambda Express backend.
#
# Routing:
#   GET  /health      → Lambda, no authorizer (public health check)
#   ANY  /{proxy+}    → Lambda, JWT authorizer (all other routes require a valid Cognito token)
#
# Auth:
#   The JWT authorizer validates Bearer tokens issued by the Cognito User Pool.
#   It fetches the JWKS from the Cognito well-known endpoint, verifies the RS256
#   signature, and checks iss/aud/exp claims — no Lambda authorizer needed.
#
# Lambda invocation:
#   API Gateway invokes the Lambda via the standard Lambda Invoke API (not the
#   Function URL). The Function URL uses auth_type = AWS_IAM, so it cannot be
#   called directly from the internet.

# ---------------------------------------------------------------------------
# Cognito User Pool
# ---------------------------------------------------------------------------

resource "aws_cognito_user_pool" "this" {
  name = var.name

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
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Token validity.
  access_token_validity  = 1   # hours
  id_token_validity      = 1   # hours
  refresh_token_validity = 30  # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Enable OAuth2 / OIDC authorization code flow (required for PKCE).
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = [
    "http://localhost:4200",
    "http://breadly-dev-frontend.s3-website.eu-central-1.amazonaws.com",
  ]

  logout_urls = [
    "http://localhost:4200",
    "http://breadly-dev-frontend.s3-website.eu-central-1.amazonaws.com",
  ]
}

# Cognito Hosted UI domain — required to expose the /oauth2/authorize and
# /oauth2/token endpoints used by the PKCE authorization code flow.
# Resulting domain: <var.name>.auth.<region>.amazoncognito.com
resource "aws_cognito_user_pool_domain" "this" {
  domain       = var.name
  user_pool_id = aws_cognito_user_pool.this.id
}

# ---------------------------------------------------------------------------
# HTTP API
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "this" {
  name          = var.name
  protocol_type = "HTTP"

  # CORS is handled by the Express app; disable API Gateway managed CORS to
  # avoid double headers.
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    allow_headers = ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 86400
  }

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  tags = var.tags
}

# ---------------------------------------------------------------------------
# Lambda Integration
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.this.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.lambda_function_arn
  integration_method = "POST"

  # Payload format v2.0 is the default for HTTP API and is fully supported by
  # the Lambda Web Adapter (LWA).
  payload_format_version = "2.0"
}

# Grant API Gateway permission to invoke the Lambda function.
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# ---------------------------------------------------------------------------
# JWT Authorizer (Cognito)
# ---------------------------------------------------------------------------

locals {
  cognito_issuer_url = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.name}-cognito-jwt"

  jwt_configuration {
    issuer   = local.cognito_issuer_url
    audience = [aws_cognito_user_pool_client.this.id]
  }
}

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

# Public route — no authorizer. GET /health is used by load balancers and
# monitoring tools; it must not require authentication.
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "NONE"
}

# Protected catch-all route — all other requests require a valid Cognito JWT.
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
