variable "name" {
  description = "Base name prefix for scheduler resources."
  type        = string
}

variable "group_name" {
  description = "Name of the EventBridge Schedule Group."
  type        = string
}

variable "config_json" {
  description = "JSON string contents of the schedules config file."
  type        = string
}

variable "api_gateway_arn" {
  description = "ARN of the API Gateway HTTP API (used as the EventBridge target)."
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway HTTP API (used in IAM policy)."
  type        = string
}

variable "api_gateway_stage" {
  description = "Stage name of the API Gateway HTTP API (e.g. '$default')."
  type        = string
  default     = "$default"
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
