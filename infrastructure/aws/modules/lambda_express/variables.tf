# modules/lambda_express/variables.tf — module input variables.

variable "name" {
  description = "Base name prefix used for all resources (e.g. breadly-dev-backend)."
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
  description = "Lambda handler in module/file notation (no .js extension — Lambda splits on the last dot to derive the module path and exported function name)."
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
  description = "Port the Express server listens on. Must match the app's PORT env var."
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
  description = "MongoDB connection string injected as MONGODB_CONNECTION_STRING. Pass an empty string for Lambdas that do not need database access (e.g. the public Lambda)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "extra_env_vars" {
  description = "Additional environment variables merged into the Lambda function's environment block. Use this to pass runtime config that differs per Lambda deployment (e.g. COGNITO_ISSUER for the public Lambda)."
  type        = map(string)
  default     = {}
}
