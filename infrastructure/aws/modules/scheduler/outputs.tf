output "schedule_group_name" {
  description = "Name of the EventBridge Schedule Group."
  value       = aws_scheduler_schedule_group.this.name
}

output "scheduler_role_arn" {
  description = "ARN of the IAM role used by EventBridge Scheduler."
  value       = aws_iam_role.scheduler_execution.arn
}

output "lambda_manage_schedules_policy_arn" {
  description = "ARN of the IAM policy that allows the Lambda to manage schedules."
  value       = aws_iam_policy.lambda_manage_schedules.arn
}
