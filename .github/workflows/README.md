# GitHub Actions — Workflows

## `deploy-frontend.yml`

Lints, tests, builds, and deploys the Angular frontend to S3 via Terraform.

### Triggers

| Trigger | Target environment |
|---|---|
| Push to `main` (paths: `breadly-frontend/**`, `infrastructure/aws/frontend/**`) | `dev` (automatic) |
| `workflow_dispatch` → select `dev` or `prod` | chosen environment (manual) |

Production is **never deployed automatically**. Use the GitHub Actions UI "Run workflow" button and select `prod`.

---

### Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions → New repository secret** to add each of the following.

| Secret | Description | Example |
|---|---|---|
| `AWS_OIDC_ROLE_ARN` | ARN of the IAM role the runner assumes via OIDC. Must have a trust policy allowing `token.actions.githubusercontent.com`. | `arn:aws:iam::123456789012:role/BreadlyGitHubDeploy` |
| `AWS_REGION` | AWS region for all resources and the Terraform state bucket. | `eu-central-1` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID. Used by the Terraform provider as a deployment guard. | `123456789012` |
| `TF_STATE_BUCKET` | Name of the S3 bucket that stores Terraform state. Must exist before the first run — see the bootstrap section in `infrastructure/aws/README.md`. | `123456789012-breadly-tfstate` |
| `TF_LOCK_TABLE` | Name of the DynamoDB table used for Terraform state locking. Must exist before the first run. | `breadly-tfstate-lock` |

---

### One-time OIDC IAM setup

Create an IAM role in your AWS account with the following trust policy. Replace `YOUR_GITHUB_ORG` and `YOUR_REPO_NAME` with the actual values.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/YOUR_REPO_NAME:*"
        }
      }
    }
  ]
}
```

The role needs the following IAM permissions at minimum:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3StateBucket",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_STATE_BUCKET",
        "arn:aws:s3:::YOUR_STATE_BUCKET/*"
      ]
    },
    {
      "Sid": "DynamoDBLock",
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/YOUR_LOCK_TABLE"
    },
    {
      "Sid": "FrontendBucket",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket", "s3:DeleteBucket",
        "s3:GetBucketPolicy", "s3:PutBucketPolicy", "s3:DeleteBucketPolicy",
        "s3:GetBucketWebsite", "s3:PutBucketWebsite", "s3:DeleteBucketWebsite",
        "s3:GetBucketVersioning", "s3:PutBucketVersioning",
        "s3:GetBucketPublicAccessBlock", "s3:PutBucketPublicAccessBlock",
        "s3:GetEncryptionConfiguration", "s3:PutEncryptionConfiguration",
        "s3:ListBucket",
        "s3:GetObject", "s3:PutObject", "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::breadly-*-frontend",
        "arn:aws:s3:::breadly-*-frontend/*"
      ]
    }
  ]
}
```

Once the role is created, store its ARN as the `AWS_OIDC_ROLE_ARN` secret.
