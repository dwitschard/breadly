# modules/s3_static_site/outputs.tf — module outputs.

output "bucket_id" {
  description = "S3 bucket name."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "S3 bucket ARN."
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = "Regional S3 domain name; use as CloudFront origin when needed."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}

output "website_endpoint" {
  description = "Public HTTP URL of the S3 static website."
  value       = "http://${aws_s3_bucket_website_configuration.this.website_endpoint}"
}

output "website_domain" {
  description = "Bare domain of the S3 website endpoint (no protocol prefix)."
  value       = aws_s3_bucket_website_configuration.this.website_endpoint
}

output "uploaded_file_count" {
  description = "Number of files uploaded to the bucket in the last apply."
  value       = length(aws_s3_object.frontend_files)
}
