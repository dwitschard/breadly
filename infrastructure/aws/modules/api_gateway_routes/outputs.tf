# modules/api_gateway_routes/outputs.tf

output "authorizer_id" {
  description = "ID of the per-branch JWT authorizer."
  value       = aws_apigatewayv2_authorizer.cognito.id
}
