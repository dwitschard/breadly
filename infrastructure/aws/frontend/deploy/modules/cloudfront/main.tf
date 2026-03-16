# modules/cloudfront/main.tf — provisions a CloudFront distribution in front of
# the S3 static site bucket using Origin Access Control (OAC).
#
# Access model:
#   • S3 bucket has NO public bucket policy — all traffic must go through CloudFront.
#   • OAC signs every origin request with SigV4 so S3 can verify the request came
#     from this specific CloudFront distribution.
#   • The bucket policy (managed here) grants s3:GetObject only to this distribution.
#
# SPA routing:
#   • Default root object: index.html
#   • Custom error responses map 403 and 404 (returned by S3 for missing keys) to
#     /index.html with HTTP 200, enabling Angular's client-side router to handle the URL.

# ---------------------------------------------------------------------------
# Origin Access Control
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = var.name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------------------------------------------------------------------
# CloudFront Distribution
# ---------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "this" {
  comment             = var.name
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # EU + North America

  origin {
    domain_name              = var.bucket_regional_domain_name
    origin_id                = "s3-${var.bucket_id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${var.bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # 1 hour default TTL; S3 cache-control headers on individual objects override this.
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Angular SPA: S3 returns 403 (AccessDenied) for any key that doesn't exist.
  # Map both 403 and 404 to /index.html so the Angular router can take over.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = var.tags
}

# ---------------------------------------------------------------------------
# S3 Bucket Policy — CloudFront OAC only
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "cloudfront_oac" {
  bucket = var.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${var.bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
        }
      }
    }]
  })
}
