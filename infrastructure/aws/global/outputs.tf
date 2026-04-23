# outputs.tf — global module outputs.

output "hosted_zone_id" {
  description = "Route53 hosted zone ID."
  value       = data.aws_route53_zone.main.zone_id
}

output "certificate_arn" {
  description = "ACM wildcard certificate ARN (us-east-1)."
  value       = aws_acm_certificate_validation.wildcard.certificate_arn
}

output "app_domain" {
  description = "Application domain (e.g. breadly.example.com)."
  value       = local.app_domain
}

output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity."
  value       = aws_ses_domain_identity.this.arn
}

output "ses_send_policy_arn" {
  description = "ARN of the IAM policy granting SES send permissions."
  value       = aws_iam_policy.ses_send.arn
}

output "ses_config_set_dev" {
  description = "Name of the SES configuration set for the dev environment."
  value       = aws_ses_configuration_set.dev.name
}

output "ses_config_set_prod" {
  description = "Name of the SES configuration set for the prod environment."
  value       = aws_ses_configuration_set.prod.name
}
