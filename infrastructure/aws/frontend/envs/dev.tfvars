# ─────────────────────────────────────────────────────────────────────────────
# envs/dev.tfvars
#
# Non-sensitive variable values for the `dev` Terraform workspace.
#
# Sensitive values (aws_account_id, aws_region) are NOT stored here.
# They are injected at apply time via TF_VAR_* environment variables sourced
# from GitHub Secrets (see .github/workflows/deploy-frontend.yml) or exported
# locally before running terraform:
#
#   export TF_VAR_aws_account_id="123456789012"
#   export TF_VAR_aws_region="eu-central-1"
#
# Apply manually:
#   terraform workspace select -or-create dev
#   terraform apply -var-file=envs/dev.tfvars
# ─────────────────────────────────────────────────────────────────────────────

# ── Project metadata ──────────────────────────────────────────────────────────

project_name = "breadly"

# ── Frontend build ────────────────────────────────────────────────────────────

# Path to the Angular build output relative to the Terraform working directory.
# The CI pipeline overrides this with the absolute artifact path via
# TF_VAR_frontend_dist_path. This default covers local runs from the repo root.
frontend_dist_path = "../../../breadly-frontend/dist/breadly-frontend/browser"

# SPA routing: both index and error point to index.html so Angular's router
# handles all client-side navigation, including deep links and 404s.
index_document = "index.html"
error_document = "index.html"
