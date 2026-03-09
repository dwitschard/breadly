# ─────────────────────────────────────────────────────────────────────────────
# bootstrap/backend.tf
#
# Local backend — state is stored on disk in this directory.
#
# Why local?
# ──────────
# The S3 bucket and DynamoDB table that serve as the remote backend for all
# other Terraform roots are created by THIS root.  It is impossible for
# Terraform to store its own state in a bucket it hasn't created yet, so
# bootstrap must use the local backend.
#
# The resulting terraform.tfstate file:
#  • Contains only resource IDs (bucket name, table name, role ARN) — no
#    secrets or credentials.
#  • Is environment-specific and should NOT be committed to source control.
#    It is covered by the root-level .gitignore.
#  • Should be preserved after the first apply so that subsequent runs
#    (e.g. updating the IAM policy) can detect drift.  Back it up somewhere
#    safe (e.g. a personal S3 bucket or 1Password) after the first apply.
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  backend "local" {}
}
