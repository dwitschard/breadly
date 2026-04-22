# modules/scheduler/main.tf — EventBridge Scheduler resources.
#
# Creates a schedule group, IAM execution role for EventBridge-to-API-Gateway,
# and recurring schedules from the config file.

locals {
  config    = jsondecode(var.config_json)
  defaults  = local.config.defaults
  schedules = { for s in local.config.schedules : s.name => s if s.enabled }
}

# ---------------------------------------------------------------------------
# Schedule Group
# ---------------------------------------------------------------------------

resource "aws_scheduler_schedule_group" "this" {
  name = var.group_name

  tags = var.tags
}

# ---------------------------------------------------------------------------
# IAM Role — allows EventBridge Scheduler to invoke API Gateway
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler_execution" {
  name               = "${var.name}-scheduler-role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json

  tags = var.tags
}

data "aws_iam_policy_document" "scheduler_invoke_apigw" {
  statement {
    effect    = "Allow"
    actions   = ["execute-api:Invoke"]
    resources = ["${var.api_gateway_execution_arn}/*/POST/api/internal/*"]
  }
}

resource "aws_iam_role_policy" "scheduler_invoke_apigw" {
  name   = "invoke-apigw"
  role   = aws_iam_role.scheduler_execution.id
  policy = data.aws_iam_policy_document.scheduler_invoke_apigw.json
}

# ---------------------------------------------------------------------------
# IAM Policy — allows the backend Lambda to manage schedules at runtime
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_manage_schedules" {
  statement {
    effect = "Allow"
    actions = [
      "scheduler:CreateSchedule",
      "scheduler:DeleteSchedule",
      "scheduler:ListSchedules",
    ]
    resources = ["arn:aws:scheduler:*:*:schedule/${aws_scheduler_schedule_group.this.name}/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.scheduler_execution.arn]
  }
}

resource "aws_iam_policy" "lambda_manage_schedules" {
  name   = "${var.name}-lambda-manage-schedules"
  policy = data.aws_iam_policy_document.lambda_manage_schedules.json

  tags = var.tags
}

# ---------------------------------------------------------------------------
# Recurring Schedules (from config)
# ---------------------------------------------------------------------------

resource "aws_scheduler_schedule" "recurring" {
  for_each = local.schedules

  name       = "${var.name}-${each.key}"
  group_name = aws_scheduler_schedule_group.this.name

  schedule_expression          = each.value.schedule_expression
  schedule_expression_timezone = each.value.timezone

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "${var.api_gateway_arn}/${each.value.target.method}${each.value.target.path}"
    role_arn = aws_iam_role.scheduler_execution.arn
    input    = jsonencode(each.value.payload)

    retry_policy {
      maximum_retry_attempts       = try(each.value.retry_policy.maximum_retry_attempts, local.defaults.retry_policy.maximum_retry_attempts)
      maximum_event_age_in_seconds = try(each.value.retry_policy.maximum_event_age_in_seconds, local.defaults.retry_policy.maximum_event_age_in_seconds)
    }
  }
}
