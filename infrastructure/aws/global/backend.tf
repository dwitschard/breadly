# backend.tf — S3 remote state backend for the global module.
# Uses the dedicated global state bucket (breadly-global-tfstate).

terraform {
  backend "s3" {
    bucket = ""

    key = "global/terraform.tfstate"

    region         = ""
    encrypt        = true
    dynamodb_table = ""
  }
}
