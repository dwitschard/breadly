# Breadly

A recipe management application. See `AGENTS.md` for project structure and coding conventions.

---

## Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js + npm | 20.x | `brew install node` |
| Terraform | ≥ 1.6.0 | `brew install terraform` |
| AWS CLI | 2.x | `brew install awscli` |
| Angular CLI | 21.x | `npm install -g @angular/cli` |

---

### Step 1 — IAM bootstrap (run once per AWS account)

Creates the GitHub Actions OIDC provider, the `Github-Deployer` IAM role, and the `local-dynamodb-user` IAM user (for local dev DynamoDB access).

```bash
cd breadly-backend/scripts
npm install
npm run setup-aws-iam
```

Copy the printed `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` immediately — they are shown only once. These go into `breadly-backend/src/.env` for local development (see Step 6).

---

### Step 2 — GitHub repository secrets and variables

**Settings → Secrets and variables → Actions → Secrets** (repository-level):

| Secret | Description |
|---|---|
| `AWS_OIDC_ROLE_ARN` | ARN of the `Github-Deployer` role created in Step 1 |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID |

**Settings → Secrets and variables → Actions → Variables** (repository-level):

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region for all resources (e.g. `eu-central-1`) |
| `DOMAIN_NAME` | Root domain registered in Route53 (e.g. `breadly.app`) |
| `DMARC_RUA_EMAIL` | Email address for DMARC aggregate reports |

**Settings → Secrets and variables → Actions → Environments** — create environments `dev`, `prod`, and `preview`, each with:

| Secret | Scope | Description |
|---|---|---|
| `MONGODB_URI` | `dev`, `prod`, `preview` | MongoDB Atlas connection string for that environment |
| `PREVIEW_DEMO_PASSWORD` | `preview` | Password for the demo Cognito user in preview envs |
| `PREVIEW_ADMIN_PASSWORD` | `preview` | Password for the admin Cognito user in preview envs |
| `ADMIN_NOTIFICATION_EMAIL` | `dev`, `prod` | Email address for admin failure notifications |

---

### Step 3 — Bootstrap Terraform state buckets (once per environment)

Creates the S3 state bucket and DynamoDB lock table that all other Terraform roots depend on.

**Via GitHub Actions:** Actions → **Manage Terraform** → Run workflow → select environment (`dev`, `prod`, `preview`) → action: `create`.
---

### Step 4 — Deploy global infrastructure (DNS, ACM, SES)

Provisions the Route53 hosted zone lookup, wildcard ACM certificate, SES domain identity, and CloudFront OACs shared across all environments.

**Via GitHub Actions:** Actions → **Manage Global Infrastructure** → Run workflow.

Also triggers automatically on push to `main` when `infrastructure/aws/global/**` changes.

Requires `DOMAIN_NAME` and `DMARC_RUA_EMAIL` variables from Step 2.

---

### Step 5 — Deploy to dev

Push to `main`. The pipeline (`main.yml`) runs automatically:

1. Builds backend and frontend
2. Deploys a temporary preview and runs Playwright E2E tests
3. On success: deploys to `dev` via `infrastructure/aws/deploy/`

Production is **never deployed automatically**. Use **Actions → `_deploy.yml` → Run workflow** and select `prod`.

---

### Step 6 — Activate admin users (after first deploy)

Terraform creates Cognito users in `FORCE_CHANGE_PASSWORD` status. This script sets permanent passwords so the accounts can log in.

```bash
cd breadly-backend/scripts
npm run setup-users:dev    # prompts for admin@breadly.app password
npm run setup-users:prod   # prompts for admin@breadly.app password
```

Requires AWS credentials with Cognito admin permissions and the target environment's User Pool to exist (i.e. Step 5 must have completed at least once).

---

### Step 7 — Preview infrastructure (automatic)

The shared preview gateway (`infrastructure/aws/preview/gateway/`) is created automatically by the feature-branch workflow on first use. No manual step required.

---

## Local development

### Backend

```bash
cd breadly-backend
cp src/.env.example src/.env
# Fill in: MONGODB_CONNECTION_STRING, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# (from Step 1), COGNITO_ISSUER, COGNITO_CLIENT_ID
# Run `terraform output cognito_localhost_client_id` in infrastructure/aws/preview/gateway/
# to get COGNITO_CLIENT_ID.
npm install
npm run dev        # http://localhost:3000
```

### Frontend

```bash
cd breadly-frontend
npm install
npm run generate-api   # generates types from breadly-api/openapi.yaml
ng serve               # http://localhost:4200
```

### E2E (against a deployed preview)

```bash
cd e2e
cp .env.example .env
# Fill in: E2E_BASE_URL, E2E_DEMO_PASSWORD, E2E_ADMIN_PASSWORD
npm install
npm test
```
