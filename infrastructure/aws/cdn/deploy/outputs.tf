# outputs.tf — CDN root module outputs.

output "cloudfront_url" {
  description = "HTTPS CloudFront URL (e.g. https://xxxxx.cloudfront.net)."
  value       = module.cdn.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidations."
  value       = module.cdn.cloudfront_distribution_id
}
