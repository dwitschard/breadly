# ─────────────────────────────────────────────────────────────────────────────
# outputs.tf  (root module)
#
# Values printed to the console after `terraform apply` and accessible via
# `terraform output` or as remote state data sources in other root modules.
# ─────────────────────────────────────────────────────────────────────────────

output "frontend_bucket_id" {
  description = "The name of the S3 bucket hosting the frontend."
  value       = module.frontend.bucket_id
}

output "frontend_bucket_arn" {
  description = "The ARN of the frontend S3 bucket (useful for IAM policies)."
  value       = module.frontend.bucket_arn
}

output "frontend_website_url" {
  description = <<-EOT
    The public HTTP URL of the deployed frontend.
    Open this in a browser after `terraform apply` to verify the deployment.
  EOT
  value = module.frontend.website_endpoint
}

output "frontend_website_domain" {
  description = "The bare domain of the S3 website endpoint (no protocol prefix)."
  value       = module.frontend.website_domain
}

output "frontend_bucket_regional_domain" {
  description = <<-EOT
    The regional S3 domain name of the bucket.
    Use this as the origin when adding a CloudFront distribution later.
  EOT
  value = module.frontend.bucket_regional_domain_name
}

output "frontend_uploaded_file_count" {
  description = "Number of files synced to S3 in the last apply."
  value       = module.frontend.uploaded_file_count
}

output "active_workspace" {
  description = "The Terraform workspace that was active during this apply (dev or prod)."
  value       = terraform.workspace
}
