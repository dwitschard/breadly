output "sender_email_arn" {
  description = "ARN of the verified SES email identity."
  value       = aws_ses_email_identity.sender.arn
}

output "ses_send_policy_arn" {
  description = "ARN of the IAM policy that grants SES send permissions."
  value       = aws_iam_policy.ses_send.arn
}
