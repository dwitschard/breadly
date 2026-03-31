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
#     These handle the root/main deployment only.
#   • Preview environment SPA deep links are handled by a CloudFront Function
#     (preview_spa_fallback) that rewrites /preview/<slug>/<non-asset-path> to
#     /preview/<slug>/index.html at the viewer-request stage, before S3 returns an
#     error. This ensures each preview loads its own Angular app with the correct
#     base href and Cognito configuration.
#
# API routing:
#   • /api/* requests are forwarded to the API Gateway origin unchanged.
#   • /preview/*/api/* requests are forwarded to the API Gateway origin unchanged.
#   • /preview/* requests are forwarded to S3 (static assets and SPA shell).
#   • The Authorization header is forwarded via the AllViewerExceptHostHeader
#     managed origin request policy so the JWT reaches the Cognito authorizer.
#   • Caching is fully disabled for API responses (CachingDisabled managed policy).

locals {
  # Extract the bare hostname from the URL — CloudFront requires a domain name with
  # no scheme and no trailing slash or path (e.g. API Gateway's $default stage invoke
  # URL ends with a trailing slash which CloudFront rejects).
  api_gateway_host = regex("^https://([^/]+)", var.api_gateway_url)[0]
}

# ---------------------------------------------------------------------------
# Origin Access Control (S3)
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = var.name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------------------------------------------------------------------
# CloudFront Function — Preview SPA Fallback
# ---------------------------------------------------------------------------
# Rewrites preview SPA deep links to the correct per-branch index.html.
# Attached to the /preview/* cache behavior (viewer-request stage).
#
# Without this function, a request to /preview/<slug>/recipes/123 would hit S3,
# which returns 403 (key not found). The distribution-global custom_error_response
# would then serve /index.html (the root/main app with <base href="/">), loading
# the wrong Angular app, wrong JS bundles, and wrong Cognito configuration.
#
# The function inspects the URI: if the path after /preview/<slug>/ has no file
# extension (i.e. it's a client-side route, not a static asset), it rewrites to
# /preview/<slug>/index.html so S3 returns the correct Angular shell.

resource "aws_cloudfront_function" "preview_spa_fallback" {
  name    = "${var.name}-preview-spa"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite preview SPA deep links to /preview/<slug>/index.html"
  publish = true
  code    = <<-JS
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      var match = uri.match(/^(\/preview\/[^\/]+)(\/.*)?$/);
      if (match) {
        var subPath = match[2] || '/';
        if (!subPath.match(/\.[a-zA-Z0-9]+$/)) {
          request.uri = match[1] + '/index.html';
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
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # EU + North America

  # S3 origin — serves the Angular SPA static files.
  origin {
    domain_name              = var.bucket_regional_domain_name
    origin_id                = "s3-${var.bucket_id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  # API Gateway origin — receives /api/* and /preview/*/api/* traffic.
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

  # /preview/*/api/* → API Gateway.
  # More specific than /preview/* so CloudFront evaluates this first.
  ordered_cache_behavior {
    path_pattern           = "/preview/*/api/*"
    target_origin_id       = "apigw"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # AWS-managed CachingDisabled: no caching, all requests forwarded to origin.
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    # AWS-managed AllViewerExceptHostHeader: forwards all viewer headers
    # (including Authorization) except Host, which API Gateway sets itself.
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  # /preview/* → S3 (preview environment static assets and SPA shell).
  # Deep-linked SPA routes are rewritten to /preview/<slug>/index.html by the
  # preview_spa_fallback CloudFront Function before reaching S3.
  ordered_cache_behavior {
    path_pattern           = "/preview/*"
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

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.preview_spa_fallback.arn
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # /api/* → API Gateway (evaluated before the default S3 behavior).
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "apigw"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # AWS-managed CachingDisabled: no caching, all requests forwarded to origin.
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    # AWS-managed AllViewerExceptHostHeader: forwards all viewer headers
    # (including Authorization) except Host, which API Gateway sets itself.
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }

  # Default behavior → S3 (root Angular SPA).
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
  # These only affect the root/main deployment — preview deep links are handled
  # by the preview_spa_fallback CloudFront Function before S3 is reached.
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
