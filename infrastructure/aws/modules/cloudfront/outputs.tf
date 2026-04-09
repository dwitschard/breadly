# modules/cloudfront/outputs.tf — module outputs.

output "cloudfront_domain_name" {
  description = "HTTPS URL of the CloudFront distribution (e.g. https://xxxxx.cloudfront.net)."
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID; useful for cache invalidations."
  value       = aws_cloudfront_distribution.this.id
}
