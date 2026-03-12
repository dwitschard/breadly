# modules/lambda_express/main.tf — provisions IAM, SSM placeholder, Lambda function,
# and Lambda Function URL to expose an Express app publicly from AWS Lambda.
#
# Lambda runs outside a VPC; AWS services (SSM, etc.) are reached directly over
# the internet via IAM. MongoDB Atlas is a public SaaS endpoint — no NAT Gateway needed.
#
# Lambda Web Adapter:
#   The official AWS Lambda Web Adapter layer is attached as a Lambda layer.
#   It starts the Express server on localhost:var.port and proxies Lambda invocations
#   to it as plain HTTP requests — no code changes to the Express app required.
#   Layer ARN source: https://github.com/awslabs/aws-lambda-web-adapter

locals {
  # Lambda Web Adapter layer ARNs per region (x86_64, latest stable release).
  # Update the version suffix when a new layer version is published.
  lwa_layer_arns = {
    "eu-central-1" = "arn:aws:lambda:eu-central-1:753240598075:layer:LambdaAdapterLayerX86:24"
    "eu-west-1"    = "arn:aws:lambda:eu-west-1:753240598075:layer:LambdaAdapterLayerX86:24"
    "us-east-1"    = "arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerX86:24"
    "us-west-2"    = "arn:aws:lambda:us-west-2:753240598075:layer:LambdaAdapterLayerX86:24"
  }

  lwa_layer_arn = local.lwa_layer_arns[var.aws_region]
}

# ---------------------------------------------------------------------------
# IAM
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = var.tags
}

# Grants Lambda permission to write CloudWatch logs.
resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Allows Lambda to read the MongoDB connection string from SSM Parameter Store.
data "aws_iam_policy_document" "ssm_read" {
  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.mongodb_uri.arn]
  }
}

resource "aws_iam_policy" "ssm_read" {
  name        = "${var.name}-ssm-read"
  description = "Allows the Lambda function to read the MongoDB URI from SSM Parameter Store."
  policy      = data.aws_iam_policy_document.ssm_read.json
}

resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

# ---------------------------------------------------------------------------
# SSM Parameter — MongoDB URI placeholder
# ---------------------------------------------------------------------------

resource "aws_ssm_parameter" "mongodb_uri" {
  name        = "/${var.name}/mongodb-uri"
  description = "MongoDB connection string for the ${var.name} Lambda function. Update this value before the first deployment."
  type        = "SecureString"
  value       = "PLACEHOLDER"

  # Prevent Terraform from overwriting a real value that was set manually after provisioning.
  lifecycle {
    ignore_changes = [value]
  }

  tags = var.tags
}

# ---------------------------------------------------------------------------
# Lambda Function
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "this" {
  function_name = var.name
  role          = aws_iam_role.lambda.arn

  filename         = var.dist_zip_path
  source_code_hash = filebase64sha256(var.dist_zip_path)

  runtime = var.runtime
  handler = var.handler
  timeout = var.timeout
  memory_size = var.memory_size

  # Lambda Web Adapter layer — starts the Express server and forwards Lambda
  # invocations as HTTP requests to localhost:var.port.
  layers = [local.lwa_layer_arn]

  environment {
    variables = {
      # Required by Lambda Web Adapter to hook into the Lambda runtime.
      AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"

      # Port the Express server listens on; must match server.ts.
      PORT = tostring(var.port)

      # Path the Lambda Web Adapter polls until the server is ready to accept requests.
      READINESS_CHECK_PATH = var.readiness_check_path

      # SSM parameter name; the app reads this at startup to fetch the MongoDB URI.
      MONGODB_SSM_PARAM = aws_ssm_parameter.mongodb_uri.name
    }
  }

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.basic_execution,
    aws_iam_role_policy_attachment.ssm_read,
  ]
}

# ---------------------------------------------------------------------------
# Lambda Function URL — public HTTPS endpoint, no API Gateway required
# ---------------------------------------------------------------------------

resource "aws_lambda_function_url" "this" {
  function_name      = aws_lambda_function.this.function_name
  authorization_type = "NONE"

  cors {
    allow_origins  = ["*"]
    allow_methods  = ["*"]
    allow_headers  = ["*"]
    expose_headers = ["*"]
    max_age        = 86400
  }
}
