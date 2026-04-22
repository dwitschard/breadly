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

variable "lambda_function_arn" {
  description = "ARN of the backend Lambda function invoked by EventBridge Scheduler."
  type        = string
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}
