# modules/cloudfront/variables.tf — module input variables.

variable "name" {
  description = "Name prefix used for the CloudFront distribution comment and OAC name."
  type        = string
}

variable "bucket_id" {
  description = "S3 bucket name; used to construct the OAC bucket policy."
  type        = string
}

variable "bucket_arn" {
  description = "S3 bucket ARN; used in the OAC bucket policy resource statement."
  type        = string
}

variable "bucket_regional_domain_name" {
  description = "S3 regional domain name used as the CloudFront origin (e.g. breadly-dev-frontend.s3.eu-central-1.amazonaws.com)."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
