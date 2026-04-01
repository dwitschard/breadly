# main.tf — shared API Gateway and S3 bucket for all preview environments.
#
# Creates a single HTTP API that all preview branches add routes to.
# Creates a single shared S3 bucket for all preview frontend assets.
# No Cognito, no Lambda — those are per-branch resources managed by preview/deploy.
# Frontend files are uploaded by the workflow via `aws s3 sync`, not Terraform.

resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project_name}-preview-backend"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    allow_headers = ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    max_age       = 86400
  }

  tags = {
    Component = "preview-gateway"
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Component = "preview-gateway"
  }
}

# ---------------------------------------------------------------------------
# Shared S3 bucket for all preview frontend assets.
# Each preview stores files under a /<branch-slug>/ key prefix.
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "preview_frontend" {
  bucket        = "${var.project_name}-preview-frontend"
  force_destroy = true

  tags = {
    Component = "preview-frontend"
  }
}

resource "aws_s3_bucket_versioning" "preview_frontend" {
  bucket = aws_s3_bucket.preview_frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "preview_frontend" {
  bucket = aws_s3_bucket.preview_frontend.id

  # All public access is blocked — CloudFront OAC is the sole access path.
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true

  depends_on = [aws_s3_bucket.preview_frontend]
}
