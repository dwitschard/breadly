# modules/cloudfront/variables.tf — module input variables.

variable "name" {
  description = "Name prefix used for the CloudFront distribution comment and OAC name."
  type        = string
}

variable "preview_only" {
  description = "When true, no main S3 origin is created. The distribution only serves preview environments via per-preview S3 origins and API Gateway."
  type        = bool
  default     = false
}

variable "bucket_id" {
  description = "S3 bucket name; used to construct the OAC bucket policy. Ignored when preview_only = true."
  type        = string
  default     = ""
}

variable "bucket_arn" {
  description = "S3 bucket ARN; used in the OAC bucket policy resource statement. Ignored when preview_only = true."
  type        = string
  default     = ""
}

variable "bucket_regional_domain_name" {
  description = "S3 regional domain name used as the CloudFront origin. Ignored when preview_only = true."
  type        = string
  default     = ""
}

variable "api_gateway_url" {
  description = "HTTPS URL of the API Gateway endpoint (no trailing slash)."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}

variable "preview_buckets" {
  description = "Map of active preview environments. Key = branch slug, value = object with S3 bucket details."
  type = map(object({
    bucket_id                   = string
    bucket_arn                  = string
    bucket_regional_domain_name = string
  }))
  default = {}
}
