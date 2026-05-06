# variables.tf — input variables for the global infrastructure module.

variable "domain_name" {
  description = "Root domain name registered via Route53 (e.g. example.com)."
  type        = string
}

variable "app_subdomain" {
  description = "Subdomain prefix for the application (e.g. 'breadly' gives breadly.example.com)."
  type        = string
  default     = "breadly"
}

variable "dmarc_rua_email" {
  description = "Email address for DMARC aggregate reports (rua). Required."
  type        = string
}

variable "aws_region" {
  description = "AWS region for SES, SSM, and other regional resources."
  type        = string
  default     = "eu-central-1"
}

variable "aws_account_id" {
  description = "12-digit AWS account ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "project_name" {
  description = "Short lowercase identifier used as a prefix in all resource names."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric with hyphens, 2-21 chars, starting with a letter."
  }
}

variable "appdock_domain_name" {
  description = "The appdock platform domain name shared across all apps (e.g. appdock.ch)."
  type        = string
  default     = "appdock.ch"
}
