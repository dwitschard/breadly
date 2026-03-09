# ─────────────────────────────────────────────────────────────────────────────
# bootstrap/variables.tf
#
# Input variables for the bootstrap root module.
#
# All variables must be supplied on the CLI or via TF_VAR_* environment
# variables — there are no .tfvars files for bootstrap because this root
# is run once per AWS account per environment.
#
# Example:
#   terraform apply \
#     -var="aws_account_id=123456789012" \
#     -var="aws_region=eu-central-1"    \
#     -var="environment=dev"
# ─────────────────────────────────────────────────────────────────────────────

# ── AWS account / identity ────────────────────────────────────────────────────

variable "aws_account_id" {
  description = <<-EOT
    The 12-digit AWS account ID that all bootstrap resources will be created in.
    Used by the provider's allowed_account_ids guard.
  EOT
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "aws_region" {
  description = "AWS region for all resources (e.g. \"eu-central-1\", \"us-east-1\")."
  type        = string
  default     = "eu-central-1"
}

# ── Project metadata ──────────────────────────────────────────────────────────

variable "project_name" {
  description = <<-EOT
    Short, lowercase identifier for the project.
    Used as a prefix in resource names (state bucket, lock table).
  EOT
  type        = string
  default     = "breadly"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-21 chars, starting with a letter."
  }
}

# ── Environment ───────────────────────────────────────────────────────────────

variable "environment" {
  description = <<-EOT
    Deployment environment name. Included in every resource name so that dev
    and prod state buckets and lock tables are fully isolated.
    Examples: "dev", "prod"
  EOT
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be \"dev\" or \"prod\"."
  }
}
