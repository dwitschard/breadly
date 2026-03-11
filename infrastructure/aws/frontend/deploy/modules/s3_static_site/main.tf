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

  # ACL-based access stays blocked; policy-based public read is allowed below.
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false

  depends_on = [aws_s3_bucket.this]
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.this.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.this]
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

  depends_on = [aws_s3_bucket_policy.public_read]
}
