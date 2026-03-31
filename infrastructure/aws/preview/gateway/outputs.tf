# outputs.tf — preview gateway root module outputs.

output "api_gateway_id" {
  description = "ID of the shared preview API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "api_gateway_endpoint" {
  description = "Public HTTPS endpoint of the preview API Gateway."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "preview_bucket_id" {
  description = "Name of the shared S3 bucket for all preview frontend assets."
  value       = aws_s3_bucket.preview_frontend.id
}

output "preview_bucket_arn" {
  description = "ARN of the shared preview frontend S3 bucket."
  value       = aws_s3_bucket.preview_frontend.arn
}

output "preview_bucket_regional_domain_name" {
  description = "Regional S3 domain name for CloudFront origin configuration."
  value       = aws_s3_bucket.preview_frontend.bucket_regional_domain_name
}
