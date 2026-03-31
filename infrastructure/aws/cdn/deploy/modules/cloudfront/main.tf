# modules/cloudfront/main.tf — provisions a CloudFront distribution.
#
# Two modes:
#   Standard (preview_only = false):
#     Main S3 origin for the Angular SPA + API Gateway origin + optional preview origins.
#     Custom error responses rewrite 403/404 to /index.html for SPA routing.
#
#   Preview-only (preview_only = true):
#     No main S3 origin. Only API Gateway origin + per-preview S3 origins.
#     Default behavior falls through to API Gateway (returns 404 for unknown paths).
#     SPA routing for previews is handled by the preview_spa_fallback CloudFront Function.
#
# Preview origins:
#   Each active preview environment gets its own S3 origin, OAC, bucket policy,
#   and /preview/<slug>/* cache behavior. These are created dynamically from the
#   preview_buckets variable.

locals {
  api_gateway_host = regex("^https://([^/]+)", var.api_gateway_url)[0]
}

# ---------------------------------------------------------------------------
# Origin Access Control — main S3 bucket (standard mode only)
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "this" {
  count = var.preview_only ? 0 : 1

  name                              = var.name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------------------------------------------------------------------
# Origin Access Control — per-preview S3 buckets
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "preview" {
  for_each = var.preview_buckets

  name                              = substr("${var.name}-preview-${each.key}", 0, 64)
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------------------------------------------------------------------
# CloudFront Function — Preview SPA Fallback & URI Rewrite
# ---------------------------------------------------------------------------

resource "aws_cloudfront_function" "preview_spa_fallback" {
  name    = "${var.name}-preview-spa"
  runtime = "cloudfront-js-2.0"
  comment = "Strip /preview/<slug> prefix and rewrite SPA deep links to /index.html"
  publish = true
  code    = <<-JS
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      var match = uri.match(/^\/preview\/[^\/]+(\/.*)?$/);
      if (match) {
        var subPath = match[1] || '/';
        if (subPath === '/') {
          request.uri = '/index.html';
        } else if (!subPath.match(/\.[a-zA-Z0-9]+$/)) {
          request.uri = '/index.html';
        } else {
          request.uri = subPath;
        }
      }
      return request;
    }
  JS
}

# ---------------------------------------------------------------------------
# CloudFront Distribution
# ---------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "this" {
  comment             = var.name
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = var.preview_only ? null : "index.html"
  price_class         = "PriceClass_100"

  # Main S3 origin — standard mode only.
  dynamic "origin" {
    for_each = var.preview_only ? [] : [1]
    content {
      domain_name              = var.bucket_regional_domain_name
      origin_id                = "s3-${var.bucket_id}"
      origin_access_control_id = aws_cloudfront_origin_access_control.this[0].id
    }
  }

  # API Gateway origin.
  origin {
    domain_name = local.api_gateway_host
    origin_id   = "apigw"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Per-preview S3 origins.
  dynamic "origin" {
    for_each = var.preview_buckets
    content {
      domain_name              = origin.value.bucket_regional_domain_name
      origin_id                = "s3-preview-${origin.key}"
      origin_access_control_id = aws_cloudfront_origin_access_control.preview[origin.key].id
    }
  }

  # /preview/*/api/* -> API Gateway (evaluated before per-preview S3 behaviors).
  ordered_cache_behavior {
    path_pattern           = "/preview/*/api/*"
    target_origin_id       = "apigw"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Managed-CachingDisabled: forward all requests to API Gateway, no caching.
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    # Managed-AllViewerExceptHostHeader: forward all viewer headers except Host.
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  # Per-preview /preview/<slug>/* -> per-preview S3 bucket.
  dynamic "ordered_cache_behavior" {
    for_each = var.preview_buckets
    content {
      path_pattern           = "/preview/${ordered_cache_behavior.key}/*"
      target_origin_id       = "s3-preview-${ordered_cache_behavior.key}"
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

      function_association {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.preview_spa_fallback.arn
      }

      min_ttl     = 0
      default_ttl = 3600
      max_ttl     = 86400
    }
  }

  # /api/* -> API Gateway (standard mode only; preview mode has no /api/* routes).
  dynamic "ordered_cache_behavior" {
    for_each = var.preview_only ? [] : [1]
    content {
      path_pattern           = "/api/*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "https-only"
      allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      # Managed-CachingDisabled: forward all requests to API Gateway, no caching.
      cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
      # Managed-AllViewerExceptHostHeader: forward all viewer headers except Host.
      origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
    }
  }

  # Default cache behavior.
  # Standard mode: points to main S3 bucket.
  # Preview-only mode: points to API Gateway (returns 404 for non-preview paths).
  default_cache_behavior {
    target_origin_id       = var.preview_only ? "apigw" : "s3-${var.bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = var.preview_only ? ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"] : ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA error responses — standard mode only.
  # Maps 403/404 from S3 to /index.html for Angular client-side routing.
  # Preview SPA routing is handled by the CloudFront Function instead.
  dynamic "custom_error_response" {
    for_each = var.preview_only ? [] : [403, 404]
    content {
      error_code            = custom_error_response.value
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    }
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
# S3 Bucket Policy — main bucket (standard mode only)
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "cloudfront_oac" {
  count  = var.preview_only ? 0 : 1
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

# ---------------------------------------------------------------------------
# S3 Bucket Policies — per-preview buckets
# ---------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "preview_oac" {
  for_each = var.preview_buckets

  bucket = each.value.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${each.value.bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
        }
      }
    }]
  })
}
