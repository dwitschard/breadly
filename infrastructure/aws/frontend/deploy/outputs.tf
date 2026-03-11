# outputs.tf — root module outputs.

output "frontend_bucket_id" {
  description = "Name of the S3 bucket hosting the frontend."
  value       = module.frontend.bucket_id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket."
  value       = module.frontend.bucket_arn
}

output "frontend_website_url" {
  description = "Public HTTP URL of the deployed frontend."
  value       = module.frontend.website_endpoint
}

output "frontend_bucket_regional_domain" {
  description = "Regional S3 domain name; use as CloudFront origin when needed."
  value       = module.frontend.bucket_regional_domain_name
}

output "frontend_uploaded_file_count" {
  description = "Number of files synced to S3 in the last apply."
  value       = module.frontend.uploaded_file_count
}
