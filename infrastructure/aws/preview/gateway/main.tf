# main.tf — shared API Gateway for all preview environments.
#
# Creates a single HTTP API that all preview branches add routes to.
# No Cognito, no Lambda — those are per-branch resources managed by preview/deploy.

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project_name}-preview-backend"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    allow_headers = ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 86400
  }

  tags = {
    Component = "preview-gateway"
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Component = "preview-gateway"
  }
}
