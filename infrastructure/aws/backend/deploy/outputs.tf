# outputs.tf — root module outputs.

output "backend_function_url" {
  description = "Public HTTPS URL of the deployed backend Lambda function."
  value       = module.backend.function_url
}
