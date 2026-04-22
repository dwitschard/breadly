variable "name" {
  description = "Base name prefix for SES resources."
  type        = string
}

variable "sender_email" {
  description = "Email address to verify as the sender identity."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
