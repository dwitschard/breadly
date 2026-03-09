# ─────────────────────────────────────────────────────────────────────────────
# modules/s3_static_site/outputs.tf
#
# Values exported by the s3_static_site module so that the calling root module
# (and any other module that composes this one) can reference them without
# reaching into the module's internal resources.
# ─────────────────────────────────────────────────────────────────────────────

output "bucket_id" {
  description = "The name of the S3 bucket (same as the bucket ID)."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket.  Use this to grant IAM permissions to the bucket."
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = <<-EOT
    The bucket's region-specific domain name.
    Use this as the origin domain when attaching a CloudFront distribution in
    the future (preferred over the website endpoint for CloudFront origins).
    Example: "breadly-dev-frontend.s3.eu-central-1.amazonaws.com"
  EOT
  value = aws_s3_bucket.this.bucket_regional_domain_name
}

output "website_endpoint" {
  description = <<-EOT
    The HTTP URL of the S3 static website endpoint.
    This is publicly accessible immediately after `terraform apply`.
    Note: this endpoint is HTTP only.  Add CloudFront for HTTPS.
    Example: "http://breadly-dev-frontend.s3-website.eu-central-1.amazonaws.com"
  EOT
  value = "http://${aws_s3_bucket_website_configuration.this.website_endpoint}"
}

output "website_domain" {
  description = "The bare domain of the website endpoint (without the http:// prefix)."
  value       = aws_s3_bucket_website_configuration.this.website_endpoint
}

output "uploaded_file_count" {
  description = "The number of files uploaded to the bucket in the last apply."
  value       = length(aws_s3_object.frontend_files)
}
