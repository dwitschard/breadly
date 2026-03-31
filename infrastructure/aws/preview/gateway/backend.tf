# backend.tf — S3 remote state backend for the preview gateway module.
# Uses the preview state bucket (breadly-preview-tfstate).

terraform {
  backend "s3" {
    bucket = ""

    key = "gateway/terraform.tfstate"

    region         = ""
    encrypt        = true
    dynamodb_table = ""
  }
}
