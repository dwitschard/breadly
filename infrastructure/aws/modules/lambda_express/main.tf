# modules/lambda_express/main.tf — provisions IAM and Lambda function.
#
# Lambda runs outside a VPC; MongoDB Atlas is a public SaaS endpoint — no NAT Gateway needed.
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

# ---------------------------------------------------------------------------
# Lambda Function
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "this" {
  function_name = var.name
  role          = aws_iam_role.lambda.arn

  filename         = var.dist_zip_path
  source_code_hash = filebase64sha256(var.dist_zip_path)

  runtime     = var.runtime
  handler     = var.handler
  timeout     = var.timeout
  memory_size = var.memory_size

  # Lambda Web Adapter layer — starts the Express server and forwards Lambda
  # invocations as HTTP requests to localhost:var.port.
  layers = [local.lwa_layer_arn]

  environment {
    variables = merge(
      {
        # Required by Lambda Web Adapter to hook into the Lambda runtime.
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"

        # Port the Express server listens on; must match server.ts.
        PORT = tostring(var.port)

        # Path the Lambda Web Adapter polls until the server is ready to accept requests.
        READINESS_CHECK_PATH = var.readiness_check_path

        # MongoDB connection string. Empty string for Lambdas that don't need DB access.
        MONGODB_CONNECTION_STRING = var.mongodb_uri
      },
      var.extra_env_vars,
    )
  }

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.basic_execution,
  ]
}

# ---------------------------------------------------------------------------
# Optional extra IAM policy attachments (e.g. EventBridge Scheduler, SES)
# ---------------------------------------------------------------------------

resource "aws_iam_role_policy_attachment" "extra" {
  for_each = toset(var.extra_policy_arns)

  role       = aws_iam_role.lambda.name
  policy_arn = each.value
}
