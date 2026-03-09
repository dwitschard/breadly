# GitHub Actions — Workflows

## `bootstrap-frontend.yml`

Provisions the S3 state bucket and DynamoDB lock table for the target environment.
Must complete successfully before the first frontend deployment can run.

### Triggers

| Trigger | Behaviour |
|---|---|
| Push to `main` (paths: `infrastructure/aws/frontend/bootstrap/**`) | Runs automatically; on success triggers `deploy-frontend.yml` via `workflow_run` |
| `workflow_dispatch` → select `dev` or `prod` | Manual run for a specific environment |

### What it does

1. Authenticates to AWS via OIDC
2. `terraform init` (local backend — no remote state needed)
3. `terraform plan -detailed-exitcode` — exit `0` skips apply (already exists), exit `2` applies
4. `terraform apply` — only runs if plan found changes

---

## `deploy-frontend.yml`

Lints, tests, builds, and deploys the Angular frontend to S3 via Terraform.

### Triggers

| Trigger | Target environment |
|---|---|
| Push to `main` (paths: `breadly-frontend/**`, `infrastructure/aws/frontend/infra/**`) | `dev` (automatic) |
| `workflow_dispatch` → select `dev` or `prod` | chosen environment (manual) |
| `workflow_run: Bootstrap Frontend completed` on `main` | `dev` (automatic, only if Bootstrap Frontend succeeded) |

Production is **never deployed automatically**. Use the GitHub Actions UI "Run workflow" button and select `prod`.

The `workflow_run` trigger chains the two workflows: when a push only touches bootstrap files, `bootstrap-frontend.yml` runs first and triggers `deploy-frontend.yml` once it completes successfully. If Bootstrap Frontend fails, the deploy is skipped.

---

### Required GitHub Secrets and Variables

Navigate to **Settings → Secrets and variables → Actions** to add the following.

#### Secrets (encrypted — not visible in logs)

| Secret | Description | Example |
|---|---|---|
| `AWS_OIDC_ROLE_ARN` | ARN of the IAM role the runner assumes via OIDC. | `arn:aws:iam::123456789012:role/breadly-github-deploy` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID. Used by the Terraform provider as a deployment guard. | `123456789012` |

#### Variables (plaintext — visible in logs)

| Variable | Description | Example |
|---|---|---|
| `AWS_REGION` | AWS region for all resources and the Terraform state bucket. | `eu-central-1` |

> `TF_STATE_BUCKET` and `TF_LOCK_TABLE` are not required as GitHub Variables.
> Both workflows derive their names from `AWS_ACCOUNT_ID` and the target environment
> using the same convention as the bootstrap Terraform root:
> `<account_id>-breadly-<env>-tfstate` and `breadly-<env>-tfstate-lock`.

---

### One-time setup per environment

The S3 state bucket and DynamoDB lock table are created by the **bootstrap Terraform root**,
which the `bootstrap-frontend.yml` workflow runs automatically. For the very first deployment,
trigger it manually:

```bash
# Via GitHub UI: Actions → Bootstrap Frontend → Run workflow → select environment
# Or locally:
cd infrastructure/aws/frontend/bootstrap
terraform init
terraform apply \
  -var="aws_account_id=123456789012" \
  -var="aws_region=eu-central-1"    \
  -var="environment=dev"
```

Repeat for `prod` when needed.

The OIDC identity provider and IAM deployment role must be created separately in IAM
and stored as `AWS_OIDC_ROLE_ARN`. See `infrastructure/aws/README.md` for full details.
