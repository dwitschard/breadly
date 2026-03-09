# ─────────────────────────────────────────────────────────────────────────────
# variables.tf  (root module)
#
# All input variables for the frontend deployment.  Values are supplied either
# via a .tfvars file (recommended) or as -var flags on the CLI.
#
# Variable groups
# ───────────────
#  1. AWS account / identity   — which account and region to deploy into
#  2. Project metadata         — names and labels applied to every resource
#  3. Frontend build           — where to find the compiled Angular output
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. AWS account / identity ─────────────────────────────────────────────────

variable "aws_account_id" {
  description = <<-EOT
    The 12-digit AWS account ID that all resources will be deployed into.
    Used by the provider's `allowed_account_ids` guard and in resource naming
    to prevent accidental cross-account deployments.
  EOT
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "aws_region" {
  description = <<-EOT
    AWS region for all resources (e.g. "eu-central-1", "us-east-1").
    The state bucket region is configured separately in backend.tf.
  EOT
  type        = string
  default     = "eu-central-1"
}

variable "aws_role_arn" {
  description = <<-EOT
    Optional IAM role ARN that Terraform will assume before making API calls.
    Set this to a deployment role ARN to enable cross-account or least-privilege
    CI/CD deployments.  Leave empty to use the current environment's credentials
    directly (e.g. for local development with a named profile).

    Example: "arn:aws:iam::123456789012:role/BreadlyTerraformDeployer"
  EOT
  type        = string
  default     = ""
}

# ── 2. Project metadata ───────────────────────────────────────────────────────

variable "project_name" {
  description = <<-EOT
    Short, lowercase identifier for the project.  Used as a prefix in all
    resource names to keep them unique and traceable.
    Example: "breadly"
  EOT
  type        = string
  default     = "breadly"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-21 chars, starting with a letter."
  }
}

# ── 3. Frontend build ─────────────────────────────────────────────────────────

variable "frontend_dist_path" {
  description = <<-EOT
    Absolute or workspace-relative path to the compiled Angular output directory.
    The S3 module will upload every file it finds under this directory.

    For Angular 17+ with the application builder the default output path is:
      <repo-root>/breadly-frontend/dist/breadly-frontend/browser

    This path is resolved relative to the directory from which `terraform apply`
    is executed.  Using an absolute path or a path relative to the repo root is
    recommended for CI/CD pipelines.
  EOT
  type        = string
  default     = "../../../breadly-frontend/dist/breadly-frontend/browser"
}

variable "index_document" {
  description = "The S3 website index document (the Angular entry point)."
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = <<-EOT
    The S3 website error document returned for 4xx responses.
    For a Single-Page Application (SPA) this should be the same as
    `index_document` so that client-side routing handles the URL.
  EOT
  type        = string
  default     = "index.html"
}
