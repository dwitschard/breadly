# setup/outputs.tf — outputs printed after apply.

output "state_bucket_name" {
  description = "S3 bucket storing Terraform remote state; save as GitHub Variable TF_STATE_BUCKET."
  value       = aws_s3_bucket.tfstate.id
}

output "lock_table_name" {
  description = "DynamoDB table for Terraform state locking; save as GitHub Variable TF_LOCK_TABLE."
  value       = aws_dynamodb_table.tfstate_lock.id
}
