# modules/api_gateway/main.tf — provisions an API Gateway HTTP API with a Cognito JWT
# authorizer in front of the Lambda Express backend.
#
# Routing:
#   ANY  /api/public/{proxy+}  → public Lambda, no auth (config and other public endpoints)
#   ANY  /api/{proxy+}         → private Lambda, JWT authorizer (all other routes require a valid Cognito token)
#
# Auth:
#   The JWT authorizer validates Bearer tokens issued by the Cognito User Pool.
#   Cognito is provisioned by the separate cognito module and passed in as inputs —
#   this keeps the dependency graph clean and avoids circular references.
#
# Lambda invocation:
#   API Gateway invokes each Lambda via the standard Lambda Invoke API (not the
#   Function URL). The Function URL uses auth_type = AWS_IAM, so it cannot be
#   called directly from the internet.

# ---------------------------------------------------------------------------
# HTTP API
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "this" {
  name          = var.name
  protocol_type = "HTTP"

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
# Private Lambda Integration (authenticated routes)
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

# Grant API Gateway permission to invoke the private Lambda function.
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

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.name}-cognito-jwt"

  jwt_configuration {
    issuer   = var.cognito_issuer_url
    audience = [var.cognito_user_pool_client_id]
  }
}

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

# Protected catch-all route — all requests require a valid Cognito JWT.
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# ---------------------------------------------------------------------------
# Public Lambda Integration — unauthenticated /public/* routes
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_integration" "lambda_public" {
  api_id             = aws_apigatewayv2_api.this.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.public_lambda_function_arn
  integration_method = "POST"

  payload_format_version = "2.0"
}

# Grant API Gateway permission to invoke the public Lambda function.
resource "aws_lambda_permission" "apigw_public" {
  statement_id  = "AllowAPIGatewayInvokePublic"
  action        = "lambda:InvokeFunction"
  function_name = var.public_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# Unauthenticated catch-all for /api/public/* — no JWT required.
# More specific than ANY /api/{proxy+} so API Gateway matches this route first.
resource "aws_apigatewayv2_route" "public" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /api/public/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_public.id}"

  # No authorization_type — unauthenticated by design.
}
