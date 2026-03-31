# outputs.tf — preview gateway root module outputs.

output "api_gateway_id" {
  description = "ID of the shared preview API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "api_gateway_endpoint" {
  description = "Public HTTPS endpoint of the preview API Gateway."
  value       = aws_apigatewayv2_stage.default.invoke_url
}
