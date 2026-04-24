# modules/cloudfront/variables.tf — module input variables.

variable "name" {
  description = "Name prefix used for the CloudFront distribution comment and OAC name."
  type        = string
}

variable "preview_only" {
  description = "When true, no main S3 origin is created. The distribution only serves preview environments via a shared preview S3 bucket and API Gateway."
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

variable "preview_bucket_id" {
  description = "Name of the shared preview S3 bucket. Required when preview_only = true."
  type        = string
  default     = ""
}

variable "preview_bucket_arn" {
  description = "ARN of the shared preview S3 bucket. Required when preview_only = true."
  type        = string
  default     = ""
}

variable "preview_bucket_regional_domain_name" {
  description = "Regional S3 domain name of the shared preview bucket. Required when preview_only = true."
  type        = string
  default     = ""
}

variable "oac_id" {
  description = "Origin Access Control ID for the main S3 bucket origin. Required when preview_only = false."
  type        = string
  default     = ""
}

variable "preview_oac_id" {
  description = "Origin Access Control ID for the shared preview S3 bucket origin. Required when preview_only = true."
  type        = string
  default     = ""
}

variable "domain_aliases" {
  description = "Custom domain aliases for the CloudFront distribution. When non-empty, the ACM certificate is used."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for custom domain aliases. Required when domain_aliases is non-empty."
  type        = string
  default     = ""
}
