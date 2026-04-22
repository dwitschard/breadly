# modules/ses/main.tf — SES email identity and IAM policy for sending.

resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

data "aws_iam_policy_document" "ses_send" {
  statement {
    effect    = "Allow"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = [aws_ses_email_identity.sender.arn]
  }
}

resource "aws_iam_policy" "ses_send" {
  name   = "${var.name}-ses-send"
  policy = data.aws_iam_policy_document.ses_send.json

  tags = var.tags
}
