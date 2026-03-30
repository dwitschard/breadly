# modules/lambda_express/main.tf — provisions IAM and Lambda function for preview environments.
# Identical to the backend deploy lambda_express module.

locals {
  lwa_layer_arns = {
    "eu-central-1" = "arn:aws:lambda:eu-central-1:753240598075:layer:LambdaAdapterLayerX86:24"
    "eu-west-1"    = "arn:aws:lambda:eu-west-1:753240598075:layer:LambdaAdapterLayerX86:24"
    "us-east-1"    = "arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerX86:24"
    "us-west-2"    = "arn:aws:lambda:us-west-2:753240598075:layer:LambdaAdapterLayerX86:24"
  }

  lwa_layer_arn = local.lwa_layer_arns[var.aws_region]
}

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

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "this" {
  function_name = var.name
  role          = aws_iam_role.lambda.arn

  filename         = var.dist_zip_path
  source_code_hash = filebase64sha256(var.dist_zip_path)

  runtime     = var.runtime
  handler     = var.handler
  timeout     = var.timeout
  memory_size = var.memory_size

  layers = [local.lwa_layer_arn]

  environment {
    variables = merge(
      {
        AWS_LAMBDA_EXEC_WRAPPER     = "/opt/bootstrap"
        PORT                        = tostring(var.port)
        READINESS_CHECK_PATH        = var.readiness_check_path
        MONGODB_CONNECTION_STRING   = var.mongodb_uri
      },
      var.extra_env_vars,
    )
  }

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.basic_execution,
  ]
}
