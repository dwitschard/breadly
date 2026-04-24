# main.tf — global infrastructure: DNS, ACM, SES, redirect distribution, SSM outputs.
#
# Provisions shared, cross-environment resources:
#   1. Route53 hosted zone lookup (auto-created by Route53 domain registration)
#   2. ACM wildcard certificate in us-east-1 (CloudFront requirement)
#   3. SES domain identity with DKIM, MAIL FROM, SPF, DMARC
#   4. SES configuration sets (dev, prod)
#   5. IAM policy for SES send permissions
#   6. S3 + CloudFront redirect for root domain and www
#   7. SSM Parameter Store outputs for consumption by deploy/ and preview/gateway/

locals {
  app_domain     = "${var.app_subdomain}.${var.domain_name}"
  auth_domain    = "auth.${var.domain_name}"
  email_domain   = "email.${var.domain_name}"
  dmarc_domain   = "_dmarc.${var.domain_name}"
  www_domain     = "www.${var.domain_name}"
  www_app_domain = "www.${local.app_domain}"

  # ACM certificate SANs
  certificate_sans = [
    local.app_domain,
    "*.${local.app_domain}",
    var.domain_name,
    local.auth_domain,
    "dev.${local.auth_domain}",
    "preview.${local.auth_domain}",
    local.www_domain,
  ]
}

# ---------------------------------------------------------------------------
# Route53 — look up hosted zone auto-created by domain registration
# ---------------------------------------------------------------------------

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# ---------------------------------------------------------------------------
# ACM — wildcard certificate in us-east-1 for CloudFront
# ---------------------------------------------------------------------------

resource "aws_acm_certificate" "wildcard" {
  provider = aws.us_east_1

  domain_name               = local.app_domain
  subject_alternative_names = slice(local.certificate_sans, 1, length(local.certificate_sans))
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Component = "global-cert"
  }
}

# DNS validation records for ACM certificate.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.wildcard.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]

  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "wildcard" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.wildcard.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ---------------------------------------------------------------------------
# SES — domain identity, DKIM, MAIL FROM, DNS records
# ---------------------------------------------------------------------------

resource "aws_ses_domain_identity" "this" {
  domain = var.domain_name
}

resource "aws_ses_domain_dkim" "this" {
  domain = aws_ses_domain_identity.this.domain
}

# SES domain verification TXT record
resource "aws_route53_record" "ses_verification" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = [aws_ses_domain_identity.this.verification_token]
}

# DKIM CNAME records (3 tokens)
resource "aws_route53_record" "ses_dkim" {
  count = 3

  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${aws_ses_domain_dkim.this.dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_ses_domain_dkim.this.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

# MAIL FROM domain configuration
resource "aws_ses_domain_mail_from" "this" {
  domain           = aws_ses_domain_identity.this.domain
  mail_from_domain = local.email_domain
}

# MX record for MAIL FROM domain
resource "aws_route53_record" "ses_mail_from_mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.email_domain
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

# SPF TXT record for MAIL FROM domain
resource "aws_route53_record" "ses_mail_from_spf" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.email_domain
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC TXT record
resource "aws_route53_record" "dmarc" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.dmarc_domain
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=reject; rua=mailto:${var.dmarc_rua_email}"]
}

# SES domain identity verification
resource "aws_ses_domain_identity_verification" "this" {
  domain = aws_ses_domain_identity.this.domain

  depends_on = [aws_route53_record.ses_verification]
}

# SES email identity for testing in sandbox mode.
# After apply, the email owner must click the verification link sent by AWS.
resource "aws_ses_email_identity" "test_recipient" {
  email = "floete-argon.8h@icloud.com"
}

# ---------------------------------------------------------------------------
# SES — configuration sets (per-environment)
# ---------------------------------------------------------------------------

resource "aws_ses_configuration_set" "dev" {
  name = "${var.project_name}-dev"
}

resource "aws_ses_configuration_set" "prod" {
  name = "${var.project_name}-prod"
}

# ---------------------------------------------------------------------------
# SES — IAM policy for send permissions
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ses_send" {
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = [
      aws_ses_domain_identity.this.arn,
      aws_ses_configuration_set.dev.arn,
      aws_ses_configuration_set.prod.arn,
    ]
  }
}

resource "aws_iam_policy" "ses_send" {
  name   = "${var.project_name}-global-ses-send"
  policy = data.aws_iam_policy_document.ses_send.json

  tags = {
    Component = "global-ses"
  }
}

# ---------------------------------------------------------------------------
# Redirect — S3 bucket + CloudFront for root domain and www redirects
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "redirect" {
  bucket = "${var.project_name}-redirect"

  tags = {
    Component = "global-redirect"
  }
}

resource "aws_s3_bucket_website_configuration" "redirect" {
  bucket = aws_s3_bucket.redirect.id

  redirect_all_requests_to {
    host_name = local.app_domain
    protocol  = "https"
  }
}

resource "aws_s3_bucket_public_access_block" "redirect" {
  bucket = aws_s3_bucket.redirect.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

# CloudFront distribution for redirect (root, www, www.app)
resource "aws_cloudfront_distribution" "redirect" {
  comment         = "${var.project_name}-redirect"
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_100"
  aliases         = [var.domain_name, local.www_domain, local.www_app_domain]

  origin {
    domain_name = aws_s3_bucket_website_configuration.redirect.website_endpoint
    origin_id   = "s3-redirect"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "s3-redirect"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.wildcard.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Component = "global-redirect"
  }
}

# Route53 records for redirect domains -> redirect CloudFront distribution
resource "aws_route53_record" "redirect_a" {
  for_each = toset([var.domain_name, local.www_domain, local.www_app_domain])

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.redirect.domain_name
    zone_id                = aws_cloudfront_distribution.redirect.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "redirect_aaaa" {
  for_each = toset([var.domain_name, local.www_domain, local.www_app_domain])

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.redirect.domain_name
    zone_id                = aws_cloudfront_distribution.redirect.hosted_zone_id
    evaluate_target_health = false
  }
}

# ---------------------------------------------------------------------------
# SSM Parameter Store — outputs for consumption by deploy/ and preview/gateway/
# ---------------------------------------------------------------------------

resource "aws_ssm_parameter" "hosted_zone_id" {
  name  = "/${var.project_name}/global/hosted-zone-id"
  type  = "String"
  value = data.aws_route53_zone.main.zone_id
}

resource "aws_ssm_parameter" "certificate_arn" {
  name  = "/${var.project_name}/global/certificate-arn"
  type  = "String"
  value = aws_acm_certificate_validation.wildcard.certificate_arn
}

resource "aws_ssm_parameter" "ses_send_policy_arn" {
  name  = "/${var.project_name}/global/ses-send-policy-arn"
  type  = "String"
  value = aws_iam_policy.ses_send.arn
}

resource "aws_ssm_parameter" "domain_name" {
  name  = "/${var.project_name}/global/domain-name"
  type  = "String"
  value = var.domain_name
}

resource "aws_ssm_parameter" "app_domain" {
  name  = "/${var.project_name}/global/app-domain"
  type  = "String"
  value = local.app_domain
}

resource "aws_ssm_parameter" "ses_config_set_dev" {
  name  = "/${var.project_name}/global/ses-config-set-dev"
  type  = "String"
  value = aws_ses_configuration_set.dev.name
}

resource "aws_ssm_parameter" "ses_config_set_prod" {
  name  = "/${var.project_name}/global/ses-config-set-prod"
  type  = "String"
  value = aws_ses_configuration_set.prod.name
}
