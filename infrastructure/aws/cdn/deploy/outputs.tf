# outputs.tf — CDN root module outputs.

output "cloudfront_url" {
  description = "HTTPS CloudFront URL (e.g. https://xxxxx.cloudfront.net)."
  value       = module.cdn.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidations."
  value       = module.cdn.cloudfront_distribution_id
}

output "frontend_bucket_id" {
  description = "S3 bucket ID (passthrough from frontend state for workflow convenience). Empty in preview-only mode."
  value       = var.preview_only ? "" : data.terraform_remote_state.frontend[0].outputs.frontend_bucket_id
}
