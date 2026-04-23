# modules/cloudfront/outputs.tf — module outputs.

output "cloudfront_domain_name" {
  description = "HTTPS URL of the CloudFront distribution (e.g. https://xxxxx.cloudfront.net)."
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}

output "cloudfront_raw_domain_name" {
  description = "Raw CloudFront domain name without protocol (for Route53 alias records)."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID; useful for cache invalidations."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_hosted_zone_id" {
  description = "Route53 hosted zone ID of the CloudFront distribution (for alias records)."
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}
