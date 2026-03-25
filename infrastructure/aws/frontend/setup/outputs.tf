# setup/outputs.tf — outputs printed after apply.

output "state_bucket_name" {
  description = "S3 bucket storing Terraform remote state. Name is auto-derived as: <project_name>-<env>-tfstate"
  value       = aws_s3_bucket.tfstate.id
}

output "lock_table_name" {
  description = "DynamoDB table for Terraform state locking. Name is auto-derived as: <project_name>-<env>-tfstate-lock"
  value       = aws_dynamodb_table.tfstate_lock.id
}
