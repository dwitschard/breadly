# modules/scheduler/main.tf — EventBridge Scheduler resources.
#
# Creates a schedule group, IAM execution role for EventBridge-to-Lambda,
# and recurring schedules from the config file.
#
# EventBridge Scheduler does not support API Gateway HTTP API (v2) as a target.
# The backend Lambda is used as the templated target instead. The input payload
# is shaped as an HTTP API v2 (payload format 2.0) event so that Lambda Web
# Adapter forwards it to Express as a standard HTTP request.

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
# IAM Role — allows EventBridge Scheduler to invoke the backend Lambda
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

data "aws_iam_policy_document" "scheduler_invoke_lambda" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [var.lambda_function_arn]
  }
}

resource "aws_iam_role_policy" "scheduler_invoke_lambda" {
  name   = "invoke-lambda"
  role   = aws_iam_role.scheduler_execution.id
  policy = data.aws_iam_policy_document.scheduler_invoke_lambda.json
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
    # Lambda is a supported templated target. The ARN is the function ARN.
    # EventBridge Scheduler passes `input` as the Lambda event payload directly.
    arn      = var.lambda_function_arn
    role_arn = aws_iam_role.scheduler_execution.arn

    # Shape the input as an HTTP API v2 (payload format 2.0) event.
    # Lambda Web Adapter translates this into an HTTP request to the Express app.
    input = jsonencode({
      version  = "2.0"
      routeKey = "${each.value.target.method} ${each.value.target.path}"
      rawPath  = each.value.target.path
      requestContext = {
        http = {
          method    = each.value.target.method
          path      = each.value.target.path
          protocol  = "HTTP/1.1"
          sourceIp  = "scheduler"
          userAgent = "EventBridge-Scheduler"
        }
        stage = "$default"
      }
      headers = {
        "content-type" = "application/json"
      }
      body            = jsonencode(each.value.payload)
      isBase64Encoded = false
    })

    retry_policy {
      maximum_retry_attempts       = try(each.value.retry_policy.maximum_retry_attempts, local.defaults.retry_policy.maximum_retry_attempts)
      maximum_event_age_in_seconds = try(each.value.retry_policy.maximum_event_age_in_seconds, local.defaults.retry_policy.maximum_event_age_in_seconds)
    }
  }
}
