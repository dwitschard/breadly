# ─────────────────────────────────────────────────────────────────────────────
# modules/s3_static_site/main.tf
#
# Reusable module that provisions everything required to host a compiled
# Single-Page Application (SPA) on S3 as a public static website.
#
# Resources created by this module (in dependency order)
# ───────────────────────────────────────────────────────
#  1. aws_s3_bucket                  — the bucket itself
#  2. aws_s3_bucket_versioning       — keeps object history for rollbacks
#  3. aws_s3_bucket_website_configuration — enables S3 static website hosting
#  4. aws_s3_bucket_public_access_block   — allows public reads (required for
#                                           static website hosting)
#  5. aws_s3_bucket_policy           — grants anonymous GetObject on all keys
#  6. aws_s3_object (for_each)       — uploads every file from dist_path
#
# Design principles
# ─────────────────
# • Each logical concern lives in its own named resource so it can be targeted
#   individually (e.g. `terraform apply -target=...`).
# • The MIME-type local avoids hard-coding content types on every object; add
#   new extensions to the map to support additional file types.
# • `etag` on each aws_s3_object means Terraform only re-uploads files whose
#   content has actually changed — no unnecessary S3 API calls.
# ─────────────────────────────────────────────────────────────────────────────

# ── Local helpers ─────────────────────────────────────────────────────────────

locals {
  # Enumerate every file in the dist directory recursively.
  # The result is a set of relative paths, e.g. {"index.html", "main.js", ...}
  dist_files = fileset(var.dist_path, "**")

  # MIME-type lookup table.
  # Add entries here whenever a new file type needs to be served correctly.
  mime_types = {
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript"
    ".mjs"  = "application/javascript"
    ".json" = "application/json"
    ".map"  = "application/json"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".eot"  = "application/vnd.ms-fontobject"
    ".txt"  = "text/plain; charset=utf-8"
    ".xml"  = "application/xml"
    ".webmanifest" = "application/manifest+json"
  }
}

# ── 1. S3 bucket ──────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "this" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy

  tags = var.tags
}

# ── 2. Bucket versioning ──────────────────────────────────────────────────────
# Versioning lets you roll back to a previous frontend deployment by copying
# an older object version back to the current version.

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── 3. Static website hosting configuration ───────────────────────────────────
# Enables the S3 website endpoint and tells S3 which document to serve as the
# root and which document to return on errors.  For a SPA, both are typically
# index.html so that the client-side router handles navigation.

resource "aws_s3_bucket_website_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  index_document {
    suffix = var.index_document
  }

  error_document {
    key = var.error_document
  }
}

# ── 4. Public access block ────────────────────────────────────────────────────
# By default AWS blocks all public access on new buckets.  We must explicitly
# turn off these blocks before the bucket policy (step 5) can grant public
# read access.  Only the minimum required flags are unblocked.

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  # Allow a bucket policy that grants public access (required for static hosting)
  block_public_acls       = true  # ACL-based public access is still blocked;
  ignore_public_acls      = true  # we grant access exclusively via bucket policy.
  block_public_policy     = false # Must be false to attach the public-read policy.
  restrict_public_buckets = false # Must be false to serve public website traffic.

  # This resource must be created before the bucket policy to avoid a race
  # condition where AWS rejects the policy because the block is still active.
  depends_on = [aws_s3_bucket.this]
}

# ── 5. Bucket policy — public read ────────────────────────────────────────────
# Grants anonymous (unauthenticated) GetObject on every key in the bucket.
# This is the standard policy for an S3-hosted static website.

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

  # The public access block must allow public policies before this can be applied.
  depends_on = [aws_s3_bucket_public_access_block.this]
}

# ── 6. Upload compiled frontend files ─────────────────────────────────────────
# Iterates over every file in the dist directory and creates (or updates) the
# corresponding S3 object.  Terraform uses the file's MD5 hash (`etag`) to
# detect changes and only re-uploads modified files, keeping deploys fast.

resource "aws_s3_object" "frontend_files" {
  for_each = local.dist_files

  bucket = aws_s3_bucket.this.id
  key    = each.value
  source = "${var.dist_path}/${each.value}"

  # Re-upload only when the file content changes.
  etag = filemd5("${var.dist_path}/${each.value}")

  # Look up the MIME type by file extension; fall back to octet-stream for
  # any extension not listed in the mime_types map.
  content_type = lookup(
    local.mime_types,
    ".${reverse(split(".", each.value))[0]}",
    "application/octet-stream"
  )

  # Cache-control strategy:
  # • index.html — no-cache so browsers always fetch the latest entry point.
  # • All other files — long cache (1 year) because Angular uses content-hash
  #   filenames (e.g. main.abc123.js) so the URL changes on every build.
  cache_control = endswith(each.value, ".html") ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable"

  depends_on = [aws_s3_bucket_policy.public_read]
}
