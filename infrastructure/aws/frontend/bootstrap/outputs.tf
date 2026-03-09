# ─────────────────────────────────────────────────────────────────────────────
# bootstrap/outputs.tf
#
# Values printed after `terraform apply`.
#
# After bootstrap runs successfully, copy these values into your GitHub
# repository settings:
#
#   state_bucket_name  →  Settings → Variables → TF_STATE_BUCKET
#   lock_table_name    →  Settings → Variables → TF_LOCK_TABLE
#   aws_region         →  Settings → Variables → AWS_REGION
# ─────────────────────────────────────────────────────────────────────────────

output "state_bucket_name" {
  description = <<-EOT
    Name of the S3 bucket that stores Terraform remote state for this environment.
    Store as GitHub Variable TF_STATE_BUCKET.
  EOT
  value = aws_s3_bucket.tfstate.id
}

output "lock_table_name" {
  description = <<-EOT
    Name of the DynamoDB table used for Terraform state locking for this environment.
    Store as GitHub Variable TF_LOCK_TABLE.
  EOT
  value = aws_dynamodb_table.tfstate_lock.id
}

output "next_steps" {
  description = "Reminder of what to do after bootstrap apply."
  value       = <<-EOT

    Bootstrap complete for environment "${var.environment}".

    The deploy workflow derives state bucket and lock table names automatically.
    Store only the following in your GitHub repository (once, not per environment):

    Settings → Secrets and variables → Actions → Variables:
      AWS_REGION     = ${var.aws_region}

    Settings → Secrets and variables → Actions → Secrets:
      AWS_ACCOUNT_ID = ${var.aws_account_id}
      AWS_OIDC_ROLE_ARN = <ARN of your IAM role for GitHub Actions OIDC>

  EOT
}
