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
#
# API routing:
#   • /api/* requests are forwarded to the API Gateway origin.
#   • A CloudFront Function strips the /api prefix before forwarding, so
#     GET /api/recipe → GET https://<apigw>/recipe (as API Gateway expects).
#   • The Authorization header is forwarded via the AllViewerExceptHostHeader
#     managed origin request policy so the JWT reaches the Cognito authorizer.
#   • Caching is fully disabled for API responses (CachingDisabled managed policy).

locals {
  # Strip the https:// scheme — CloudFront origin domain_name must be a bare hostname.
  api_gateway_host = replace(var.api_gateway_url, "https://", "")
}

# ---------------------------------------------------------------------------
# CloudFront Function — strip /api prefix from viewer requests
# ---------------------------------------------------------------------------

resource "aws_cloudfront_function" "strip_api_prefix" {
  name    = "${var.name}-strip-api-prefix"
  runtime = "cloudfront-js-2.0"
  publish = true

  # Removes the leading /api segment so API Gateway receives the correct path.
  # e.g. /api/recipe  →  /recipe
  #      /api          →  /
  code = <<-EOF
    function handler(event) {
      var request = event.request;
      request.uri = request.uri.replace(/^\/api/, '') || '/';
      return request;
    }
  EOF
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

  # API Gateway origin — receives /api/* traffic after prefix stripping.
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

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_api_prefix.arn
    }
  }

  # Default behavior → S3 (Angular SPA).
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

