# modules/lambda_express/main.tf — provisions VPC, IAM, SSM placeholder, Lambda function,
# and Lambda Function URL to expose an Express app publicly from AWS Lambda.
#
# Network topology:
#   Public subnets  → Internet Gateway (for inbound traffic handled by Lambda Function URL)
#   Private subnets → NAT Gateway → Internet (for outbound calls, e.g. MongoDB Atlas)
#   Lambda runs in private subnets; the Function URL is handled by AWS infra, not the VPC.
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
# Networking
# ---------------------------------------------------------------------------

resource "aws_vpc" "this" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(var.tags, { Name = "${var.name}-vpc" })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, { Name = "${var.name}-igw" })
}

# Public subnets — used by the NAT Gateway only (Lambda does not run here).
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.${100 + count.index}.0/24"
  availability_zone = "${var.aws_region}${["a", "b"][count.index]}"

  map_public_ip_on_launch = true

  tags = merge(var.tags, { Name = "${var.name}-public-${["a", "b"][count.index]}" })
}

# Private subnets — Lambda runs here; outbound via NAT.
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = "${var.aws_region}${["a", "b"][count.index]}"

  tags = merge(var.tags, { Name = "${var.name}-private-${["a", "b"][count.index]}" })
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(var.tags, { Name = "${var.name}-nat-eip" })
}

# Single NAT Gateway in the first public subnet.
resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [aws_internet_gateway.this]

  tags = merge(var.tags, { Name = "${var.name}-nat" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(var.tags, { Name = "${var.name}-rt-public" })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }

  tags = merge(var.tags, { Name = "${var.name}-rt-private" })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ---------------------------------------------------------------------------
# Security Group
# ---------------------------------------------------------------------------

resource "aws_security_group" "lambda" {
  name        = "${var.name}-lambda-sg"
  description = "Lambda function security group — allows all outbound traffic to reach MongoDB Atlas via NAT."
  vpc_id      = aws_vpc.this.id

  # No ingress rules: Lambda Function URL ingress is handled by AWS infrastructure,
  # not by the VPC security group.

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name}-lambda-sg" })
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

# Grants Lambda permission to create ENIs in the VPC and write CloudWatch logs.
resource "aws_iam_role_policy_attachment" "vpc_access" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
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

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

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
    aws_iam_role_policy_attachment.vpc_access,
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
