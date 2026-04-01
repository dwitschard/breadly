# backend.tf — S3 remote state backend for the merged deploy module.
# bucket, region, and dynamodb_table are supplied via -backend-config at init time.
# The S3 bucket and DynamoDB table are provisioned by the setup root module.

terraform {
  backend "s3" {
    bucket = ""

    # Workspace-aware key isolates dev and prod state files.
    key = "deploy/terraform.tfstate"

    region         = ""
    encrypt        = true
    dynamodb_table = ""
  }
}
