# ─────────────────────────────────────────────────────────────────────────────
# bootstrap/main.tf
#
# One-time setup of every AWS resource that must exist before the frontend
# Terraform root can run.
#
# Resources created (in dependency order)
# ────────────────────────────────────────
#  1. aws_s3_bucket                        — Terraform remote state bucket
#  2. aws_s3_bucket_versioning             — state history / rollback
#  3. aws_s3_bucket_server_side_encryption_configuration — SSE-S3 at rest
#  4. aws_s3_bucket_public_access_block    — block all public access
#  5. aws_dynamodb_table                   — Terraform state lock table
#
# Run once per AWS account per environment:
#   terraform init
#   terraform apply \
#     -var="aws_account_id=123456789012" \
#     -var="aws_region=eu-central-1"    \
#     -var="environment=dev"
#
# After apply, note the outputs and store them as GitHub secrets/variables:
#   state_bucket_name  → TF_STATE_BUCKET  (GitHub Variable)
#   lock_table_name    → TF_LOCK_TABLE    (GitHub Variable)
# ─────────────────────────────────────────────────────────────────────────────

locals {
  state_bucket_name = "${var.project_name}-${var.environment}-tfstate"
  lock_table_name   = "${var.project_name}-${var.environment}-tfstate-lock"
}

# ── 1. S3 state bucket ────────────────────────────────────────────────────────
# Stores terraform.tfstate for all other Terraform roots in this project.
# Named with the account ID prefix to guarantee global uniqueness.

resource "aws_s3_bucket" "tfstate" {
  bucket = local.state_bucket_name

  # Allows Terraform to delete the bucket even when it still contains objects
  # and versioned state files. Required for a clean `terraform destroy`.
  force_destroy = true
}

# ── 2. State bucket versioning ────────────────────────────────────────────────
# Preserves every version of terraform.tfstate so you can roll back after a
# failed or destructive apply.

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── 3. State bucket encryption ────────────────────────────────────────────────
# Encrypts state files at rest using AES-256 (SSE-S3).
# No additional key management required.

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ── 4. Block all public access on state bucket ────────────────────────────────
# Terraform state can contain sensitive values. Ensure it is never exposed
# publicly regardless of any future bucket policy changes.

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

# ── 5. DynamoDB state lock table ──────────────────────────────────────────────
# Prevents two concurrent `terraform apply` runs from corrupting the state by
# holding a distributed lock (one item per workspace).

resource "aws_dynamodb_table" "tfstate_lock" {
  name         = local.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
