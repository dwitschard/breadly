# Terraform Cleanup Plan

## Goals

- KISS / DRY: remove duplication, dead code, and over-engineered comments
- Rename directories to better reflect their purpose
- ~62% line reduction with zero functional change

---

## Directory Renames

| Before | After |
|---|---|
| `infrastructure/aws/frontend/bootstrap/` | `infrastructure/aws/frontend/setup/` |
| `infrastructure/aws/frontend/infra/` | `infrastructure/aws/frontend/deploy/` |

---

## Changes by File

### `deploy/` (was `infra/`)

#### `variables.tf`
- Remove `aws_role_arn` — dead code, OIDC role assumption is handled by the GitHub Actions step, not the Terraform provider
- Remove `index_document` and `error_document` — triple-defaulted across `variables.tf`, both `.tfvars` files, and the module; the module default of `index.html` is sufficient
- Shorten all `<<-EOT` descriptions to single-line strings

#### `providers.tf`
- Remove `dynamic "assume_role"` block and its `for_each` logic (consequence of removing `aws_role_arn`)
- Trim verbose header comment

#### `main.tf`
- Remove `index_document` and `error_document` from the module call (use module defaults)
- Trim verbose header comment

#### `outputs.tf`
- Remove `active_workspace` — just echoes `terraform.workspace`, not useful as an output
- Remove `frontend_website_domain` — duplicate of `frontend_website_url` without the `http://` prefix; unused
- Shorten all descriptions to single lines

#### `envs/dev.tfvars` and `envs/prod.tfvars`
- **Delete both files** — every value is either a default in `variables.tf` or injected via `TF_VAR_*` env vars in CI; the files are fully redundant

#### `backend.tf`
- Trim header comment to 2–3 lines

#### `modules/s3_static_site/variables.tf`
- Shorten all `<<-EOT` descriptions to single lines

#### `modules/s3_static_site/main.tf`
- Remove verbose header and per-section comments
- Keep only the MIME map and cache-control comments (non-obvious logic)

#### `modules/s3_static_site/outputs.tf`
- Shorten all descriptions to single lines

---

### `setup/` (was `bootstrap/`)

#### `main.tf`
- Trim verbose header and per-section comments to minimal inline comments

#### `variables.tf`
- Shorten all `<<-EOT` descriptions to single lines

#### `providers.tf`
- Trim verbose header comment

#### `outputs.tf`
- Remove `next_steps` output — instructional text belongs in a README, not a Terraform output
- Shorten remaining descriptions to single lines

#### `backend.tf`
- Trim header comment to 2–3 lines

---

### Workflow Changes

#### `.github/workflows/deploy-frontend.yml`
- Update `TF_WORKING_DIR` from `infrastructure/aws/frontend/infra` → `infrastructure/aws/frontend/deploy`
- Remove `-var-file="envs/${{ env.TARGET_ENV }}.tfvars"` from both `terraform plan` and `terraform apply` steps

#### `.github/workflows/bootstrap-frontend.yml`
- Update any path references from `bootstrap` → `setup`

---

## Estimated Impact

| File | Before | After |
|---|---|---|
| `deploy/variables.tf` | ~90 lines | ~30 lines |
| `deploy/providers.tf` | ~55 lines | ~20 lines |
| `deploy/main.tf` | ~55 lines | ~20 lines |
| `deploy/outputs.tf` | ~45 lines | ~20 lines |
| `deploy/envs/*.tfvars` | 2 × ~35 lines | deleted |
| `deploy/modules/s3_static_site/main.tf` | ~175 lines | ~80 lines |
| `deploy/modules/s3_static_site/variables.tf` | ~75 lines | ~30 lines |
| `deploy/modules/s3_static_site/outputs.tf` | ~40 lines | ~20 lines |
| `setup/` (all files) | ~200 lines | ~100 lines |
| **Total** | **~850 lines** | **~320 lines** |

**~62% reduction in lines, zero functional change.**
