# modules/s3_static_site/main.tf — provisions an S3 static website bucket and uploads dist files.

locals {
  dist_files = fileset(var.dist_path, "**")

  # MIME-type lookup — add entries here to support additional file extensions.
  mime_types = {
    ".html"        = "text/html; charset=utf-8"
    ".css"         = "text/css; charset=utf-8"
    ".js"          = "application/javascript"
    ".mjs"         = "application/javascript"
    ".json"        = "application/json"
    ".map"         = "application/json"
    ".svg"         = "image/svg+xml"
    ".png"         = "image/png"
    ".jpg"         = "image/jpeg"
    ".jpeg"        = "image/jpeg"
    ".gif"         = "image/gif"
    ".webp"        = "image/webp"
    ".ico"         = "image/x-icon"
    ".woff"        = "font/woff"
    ".woff2"       = "font/woff2"
    ".ttf"         = "font/ttf"
    ".eot"         = "application/vnd.ms-fontobject"
    ".txt"         = "text/plain; charset=utf-8"
    ".xml"         = "application/xml"
    ".webmanifest" = "application/manifest+json"
  }
}

resource "aws_s3_bucket" "this" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy

  tags = var.tags
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_website_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  index_document {
    suffix = var.index_document
  }

  error_document {
    key = var.error_document
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  # All public access is blocked — CloudFront OAC is the sole access path.
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true

  depends_on = [aws_s3_bucket.this]
}

resource "aws_s3_object" "frontend_files" {
  for_each = local.dist_files

  bucket = aws_s3_bucket.this.id
  key    = each.value
  source = "${var.dist_path}/${each.value}"
  etag   = filemd5("${var.dist_path}/${each.value}")

  content_type = lookup(
    local.mime_types,
    ".${reverse(split(".", each.value))[0]}",
    "application/octet-stream"
  )

  # Cache-control strategy:
  # • index.html — no-cache so browsers always fetch the latest entry point.
  # • All other files — 1-year cache; Angular uses content-hash filenames so
  #   the URL changes on every build, making long caching safe.
  cache_control = endswith(each.value, ".html") ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable"

  depends_on = [aws_s3_bucket_public_access_block.this]
}
