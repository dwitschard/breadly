# modules/s3_static_site/variables.tf — module inputs.

variable "bucket_name" {
  description = "Globally unique S3 bucket name (e.g. \"breadly-dev-frontend\")."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "bucket_name must be 3-63 lowercase alphanumeric characters, dots, or hyphens."
  }
}

variable "dist_path" {
  description = "Path to the compiled frontend output directory to upload to S3."
  type        = string
}

variable "index_document" {
  description = "HTML file served as the website root."
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = "HTML file returned for error responses (use index.html for SPAs)."
  type        = string
  default     = "index.html"
}

variable "tags" {
  description = "Additional resource tags merged on top of the provider default_tags."
  type        = map(string)
  default     = {}
}

variable "force_destroy" {
  description = "When true, empties the bucket before destroying it (safe for non-prod)."
  type        = bool
  default     = false
}
