# ─────────────────────────────────────────────────────────────────────────────
# modules/s3_static_site/variables.tf
#
# All inputs accepted by the s3_static_site module.  Every variable has a
# description so that `terraform-docs` can auto-generate documentation, and
# validations catch misconfiguration early.
# ─────────────────────────────────────────────────────────────────────────────

variable "bucket_name" {
  description = <<-EOT
    Globally unique S3 bucket name.  S3 bucket names are shared across all AWS
    accounts worldwide, so include a project prefix and an environment suffix to
    avoid collisions.
    Example: "breadly-dev-frontend"
  EOT
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "bucket_name must be 3-63 lowercase alphanumeric characters, dots, or hyphens."
  }
}

variable "dist_path" {
  description = <<-EOT
    Path (absolute or relative to the Terraform working directory) of the
    compiled frontend output that should be uploaded to S3.
    Every file found recursively under this directory will be synced.
  EOT
  type        = string
}

variable "index_document" {
  description = "The HTML file served as the website root (e.g. \"index.html\")."
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = <<-EOT
    The HTML file returned for error responses.  For a SPA this is typically
    the same as `index_document` so client-side routing can handle the URL.
  EOT
  type        = string
  default     = "index.html"
}

variable "tags" {
  description = "Additional resource tags merged on top of the provider default_tags."
  type        = map(string)
  default     = {}
}

variable "force_destroy" {
  description = <<-EOT
    When true, all objects are deleted from the bucket before the bucket itself
    is destroyed.  Set to true in non-production environments to allow clean
    `terraform destroy` runs.  Keep false in production to prevent accidental
    data loss.
  EOT
  type        = bool
  default     = false
}
