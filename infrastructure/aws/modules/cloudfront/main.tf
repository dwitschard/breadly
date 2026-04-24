# modules/cloudfront/main.tf — provisions a CloudFront distribution.
#
# Two modes:
#   Standard (preview_only = false):
#     Main S3 origin for the Angular SPA + API Gateway origin.
#     Custom error responses rewrite 403/404 to /index.html for SPA routing.
#     A single static /preview/* behavior routes to the shared preview S3 bucket.
#
#   Preview-only (preview_only = true):
#     No main S3 origin. Only API Gateway origin + shared preview S3 bucket.
#     Default behavior falls through to API Gateway (returns 404 for unknown paths).
#     SPA routing for previews is handled by the preview_spa_rewrite CloudFront Function.
#
# Preview frontend assets:
#   All preview environments share a single S3 bucket. Each branch stores files
#   under a /<branch-slug>/ key prefix. The CloudFront Function rewrites the URI
#   to include the slug as the S3 key prefix.

locals {
  api_gateway_host   = regex("^https://([^/]+)", var.api_gateway_url)[0]
  has_preview_bucket = var.preview_only
}

# ---------------------------------------------------------------------------
# AWS Managed Cache / Origin Request Policies
# ---------------------------------------------------------------------------

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
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

  # Wait for CloudFront to fully release the OAC before Terraform deletes it.
  depends_on = [time_sleep.wait_for_distribution_delete]
}

# ---------------------------------------------------------------------------
# Origin Access Control — shared preview S3 bucket
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "preview" {
  count = local.has_preview_bucket ? 1 : 0

  name                              = "${var.name}-preview-v2"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"

  # Wait for CloudFront to fully release the OAC before Terraform deletes it.
  depends_on = [time_sleep.wait_for_distribution_delete]
}

# ---------------------------------------------------------------------------
# CloudFront Function — Preview SPA Rewrite
#
# Rewrites /preview/<slug>/... URIs to include the slug as S3 key prefix.
# For SPA deep links (no file extension), rewrites to /<slug>/index.html.
# For static assets (with file extension), rewrites to /<slug>/path/to/file.
# ---------------------------------------------------------------------------

resource "aws_cloudfront_function" "preview_spa_rewrite" {
  count   = local.has_preview_bucket ? 1 : 0
  name    = "${var.name}-rewrite-spa-link"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite /preview/<slug>/... to /<slug>/... key prefix, SPA fallback to /<slug>/index.html"
  publish = true
  code    = <<-JS
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      var match = uri.match(/^\/preview\/([^\/]+)(\/.*)?$/);
      if (match) {
        var slug = match[1];
        var subPath = match[2] || '/';
        if (subPath === '/' || !subPath.match(/\.[a-zA-Z0-9]+$/)) {
          request.uri = '/' + slug + '/index.html';
        } else {
          request.uri = '/' + slug + subPath;
        }
      }
      return request;
    }
  JS
}

# ---------------------------------------------------------------------------
# Destroy-time delay — CloudFront distribution deletion is asynchronous.
# Terraform marks the distribution as destroyed once the API returns, but AWS
# may still consider the OAC "in use" for several minutes. This sleep sits
# between the distribution and the OACs in the dependency graph, giving
# CloudFront time to fully release them.
# ---------------------------------------------------------------------------

resource "time_sleep" "wait_for_distribution_delete" {
  destroy_duration = "3m"

  depends_on = [aws_cloudfront_distribution.this]
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
  aliases             = var.domain_aliases

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

  # Shared preview S3 bucket origin.
  dynamic "origin" {
    for_each = local.has_preview_bucket ? [1] : []
    content {
      domain_name              = var.preview_bucket_regional_domain_name
      origin_id                = "s3-preview"
      origin_access_control_id = aws_cloudfront_origin_access_control.preview[0].id
    }
  }

  # /preview/*/api/* -> API Gateway (evaluated before the /preview/* S3 behavior).
  dynamic "ordered_cache_behavior" {
    for_each = local.has_preview_bucket ? [1] : []
    content {
      path_pattern           = "/preview/*/api/*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "https-only"
      allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      # Managed-CachingDisabled: forward all requests to API Gateway, no caching.
      cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
      # Managed-AllViewerExceptHostHeader: forward all viewer headers except Host.
      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    }
  }

  # /preview/* -> shared preview S3 bucket (static behavior, no per-branch config).
  dynamic "ordered_cache_behavior" {
    for_each = local.has_preview_bucket ? [1] : []
    content {
      path_pattern           = "/preview/*"
      target_origin_id       = "s3-preview"
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
        function_arn = aws_cloudfront_function.preview_spa_rewrite[0].arn
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
      cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
      # Managed-AllViewerExceptHostHeader: forward all viewer headers except Host.
      origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
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
    cloudfront_default_certificate = length(var.domain_aliases) == 0
    acm_certificate_arn            = length(var.domain_aliases) > 0 ? var.acm_certificate_arn : null
    ssl_support_method             = length(var.domain_aliases) > 0 ? "sni-only" : null
    minimum_protocol_version       = length(var.domain_aliases) > 0 ? "TLSv1.2_2021" : null
  }

  tags = var.tags
}

# ---------------------------------------------------------------------------
# S3 Bucket Policy — main bucket (standard mode only)
# ---------------------------------------------------------------------------

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
# S3 Bucket Policy — shared preview bucket
# ---------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "preview_oac" {
  count  = local.has_preview_bucket ? 1 : 0
  bucket = var.preview_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${var.preview_bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
        }
      }
    }]
  })
}
