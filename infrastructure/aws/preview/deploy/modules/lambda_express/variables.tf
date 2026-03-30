# modules/lambda_express/variables.tf

variable "name" {
  description = "Base name prefix used for all resources."
  type        = string
}

variable "dist_zip_path" {
  description = "Absolute path to the deployment zip containing dist/ and node_modules/."
  type        = string
}

variable "aws_region" {
  description = "AWS region; used to reference the Lambda Web Adapter layer ARN."
  type        = string
}

variable "handler" {
  description = "Lambda handler."
  type        = string
  default     = "run.sh"
}

variable "runtime" {
  description = "Lambda runtime identifier."
  type        = string
  default     = "nodejs22.x"
}

variable "timeout" {
  description = "Maximum Lambda execution time in seconds."
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Lambda memory allocation in MB."
  type        = number
  default     = 512
}

variable "port" {
  description = "Port the Express server listens on."
  type        = number
  default     = 3000
}

variable "readiness_check_path" {
  description = "HTTP path the Lambda Web Adapter polls to confirm the server is ready."
  type        = string
  default     = "/health"
}

variable "tags" {
  description = "Additional tags merged onto all resources."
  type        = map(string)
  default     = {}
}

variable "mongodb_uri" {
  description = "MongoDB connection string. Pass empty string for Lambdas that do not need DB access."
  type        = string
  sensitive   = true
  default     = ""
}

variable "extra_env_vars" {
  description = "Additional environment variables merged into the Lambda function's environment block."
  type        = map(string)
  default     = {}
}
