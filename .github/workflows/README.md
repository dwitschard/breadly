# GitHub Actions — Workflows

## `build-frontend.yml`

Lints, tests, and produces a production build artifact for the Angular frontend.
No AWS credentials or infrastructure involvement.

### Triggers

| Trigger | Behaviour |
|---|---|
| Push to `main` (paths: `breadly-frontend/**`) | Runs automatically on every frontend source change |
| `workflow_dispatch` | Manual re-run of CI on demand |

### What it does

1. `npm ci`
2. `npm run lint` (Prettier)
3. `npm run test:ci` (Vitest, no-watch)
4. `npm run build` (generates API client, then `ng build`)
5. Uploads `dist/breadly-frontend/browser/` as artifact `frontend-dist` (retained 1 day)

---

## `deploy-frontend.yml`

Bootstraps the Terraform remote state backend (if needed) and deploys the Angular
SPA to S3 via Terraform. `build` and `bootstrap` run in parallel; `deploy` waits
for both to succeed.

### Triggers

| Trigger | Target environment |
|---|---|
| Push to `main` (paths: `breadly-frontend/**`, `infrastructure/aws/frontend/bootstrap/**`, `infrastructure/aws/frontend/infra/**`) | `dev` (automatic) |
| `workflow_dispatch` → select `dev` or `prod` | chosen environment (manual) |

Production is **never deployed automatically**. Use the GitHub Actions UI "Run workflow" button and select `prod`.

### Jobs

```
build ──┐
        ├──▶ deploy
bootstrap─┘
```

**`build`** — same steps as `build-frontend.yml`: lint → test → build → upload artifact.

**`bootstrap`** — runs with `environment: <TARGET_ENV>` so GitHub injects the correct
scoped secrets and variables. Uses a local Terraform backend (no remote state needed):
1. Authenticates to AWS via OIDC
2. `terraform init` (local backend)
3. `terraform plan -detailed-exitcode` — exit `0` skips apply (already exists), exit `2` applies
4. `terraform apply` — only runs if plan found changes

**`deploy`** — needs both `build` and `bootstrap`:
1. Downloads the `frontend-dist` artifact
2. Authenticates to AWS via OIDC
3. Derives state bucket / lock table names from `AWS_ACCOUNT_ID` and `TARGET_ENV`
4. `terraform init` (remote S3 backend)
5. `terraform workspace select -or-create <env>`
6. `terraform plan` + `terraform apply -auto-approve`
7. Prints the deployed website URL

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
> The deploy workflow derives their names from `AWS_ACCOUNT_ID` and the target environment
> using the same convention as the bootstrap Terraform root:
> `breadly-<env>-tfstate` and `breadly-<env>-tfstate-lock`.

---

### One-time setup per environment

The S3 state bucket and DynamoDB lock table are created by the **bootstrap** job inside
`deploy-frontend.yml`. For the very first deployment, trigger it manually:

```
GitHub UI: Actions → Deploy Frontend → Run workflow → select environment
```

Or locally:

```bash
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
