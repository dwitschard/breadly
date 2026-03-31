# modules/api_gateway_routes/main.tf — adds per-branch routes to the shared API Gateway HTTP API.
#
# Each preview branch creates:
#   ANY /preview/<slug>/api/public/{proxy+}  → public Lambda (unauthenticated)
#   ANY /preview/<slug>/api/{proxy+}         → private Lambda (JWT-protected by branch's authorizer)
#
# The public route is more specific and matched first by API Gateway.

# ---------------------------------------------------------------------------
# JWT Authorizer (per-branch Cognito)
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = var.api_gateway_id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "breadly-preview-${var.branch_slug}-cognito-jwt"

  jwt_configuration {
    issuer   = var.cognito_issuer_url
    audience = [var.cognito_user_pool_client_id]
  }
}

# ---------------------------------------------------------------------------
# Private Lambda integration
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = var.api_gateway_id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.lambda_function_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvokePreview-${var.branch_slug}"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  # Restrict invocation to this specific API Gateway and preview path only.
  source_arn = "arn:aws:execute-api:${var.aws_region}:${var.aws_account_id}:${var.api_gateway_id}/*/*/preview/${var.branch_slug}/api/*"
}

# Protected catch-all route for this preview branch.
resource "aws_apigatewayv2_route" "default" {
  api_id    = var.api_gateway_id
  route_key = "ANY /preview/${var.branch_slug}/api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# ---------------------------------------------------------------------------
# Public Lambda integration
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_integration" "lambda_public" {
  api_id             = var.api_gateway_id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.public_lambda_function_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

resource "aws_lambda_permission" "apigw_public" {
  statement_id  = "AllowAPIGatewayInvokePreviewPublic-${var.branch_slug}"
  action        = "lambda:InvokeFunction"
  function_name = var.public_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  # Restrict invocation to this specific API Gateway and preview public path only.
  source_arn = "arn:aws:execute-api:${var.aws_region}:${var.aws_account_id}:${var.api_gateway_id}/*/*/preview/${var.branch_slug}/api/public/*"
}

# Unauthenticated route for /preview/<slug>/api/public/* — no JWT required.
resource "aws_apigatewayv2_route" "public" {
  api_id    = var.api_gateway_id
  route_key = "ANY /preview/${var.branch_slug}/api/public/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_public.id}"
}
