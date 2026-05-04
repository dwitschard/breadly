# PRD: Cognito Managed Login Branding

## Problem Statement

Breadly authenticates users through Amazon Cognito's Hosted UI. Currently the login, registration, forgot-password, and email-verification pages show Cognito's default, unstyled appearance. The pages carry no Breadly branding: no logo, no brand colours, and a visual style that has nothing in common with the Angular frontend. Users who reach these screens — which is every user, every session — encounter a generic AWS interface that erodes trust and looks unprofessional.

## Solution

Apply consistent Breadly branding to the Cognito authentication pages using AWS Cognito Managed Login, the modern replacement for the classic Hosted UI customisation API. Managed Login supports a structured JSON theming system that controls colours, typography scale, component styles, dark/light/adaptive modes, and embedded image assets (logo, background). The branding configuration lives in a dedicated `breadly-idp-ui` module in the monorepo, managed by Terraform, and applied to all environments (dev, prod, and preview). No custom auth pages are built; Cognito continues to own the authentication flow.

## User Stories

1. As a Breadly user, I want the login page to display the Breadly logo, so that I know I am logging in to the right application.
2. As a Breadly user, I want the login page to use Breadly's primary blue colour on the sign-in button, so that the authentication screens feel part of the same product.
3. As a Breadly user, I want input fields on the login page to use the same rounded, bordered style as the rest of the application, so that the page feels consistent and professional.
4. As a Breadly user, I want the page background and form card to use the same white and light-grey palette as the main application, so that the visual transition feels seamless.
5. As a Breadly user, I want link colours (Forgot password, Back to sign-in) to use Breadly blue, so that interactive elements are identifiable.
6. As a Breadly user, I want error messages to use a red-tinted alert style consistent with the rest of the app, so that I can quickly identify and act on validation failures.
7. As a Breadly user, I want the hover and active states on the sign-in button to use darker blue shades, so that interactive feedback is clear.
8. As a Breadly user, I want the registration page to carry the same branding as the login page, so that the full sign-up flow is visually coherent.
9. As a Breadly user, I want the forgot-password and reset-password pages to carry the same branding, so that recovery flows do not look abandoned.
10. As a Breadly user, I want the email-verification page to carry the same branding, so that the onboarding flow maintains visual continuity.
11. As a Breadly user on any preview branch, I want the authentication pages to carry the same branding as dev and prod, so that testers and reviewers evaluate a realistic experience.
12. As a Breadly developer, I want the branding configuration to be version-controlled as a JSON file in the repository, so that changes are traceable, reviewable, and reversible.
13. As a Breadly developer, I want the logo asset to live in the same repository module as the JSON config, so that logo updates and theme changes travel together in the same commit.
14. As a Breadly developer, I want Terraform to manage the branding resource, so that every environment is always in sync with the committed configuration without manual AWS console work.
15. As a Breadly developer, I want the branding module to be a separate IntelliJ module (`breadly-idp-ui`), so that it is clearly scoped, easy to navigate, and not mixed into the frontend or infrastructure modules.
16. As a Breadly developer, I want the logo asset to be optional at plan time (gracefully absent), so that initial Terraform apply does not fail before the real logo file is ready.
17. As a Breadly developer, I want the Managed Login version to be explicitly declared in Terraform for the domain resource, so that the environment never silently reverts to the classic Hosted UI on domain recreation.

## Implementation Decisions

### Cognito feature tier
The project's Cognito user pools will be upgraded from **Lite** to **Essentials** tier. Managed Login is only available on Essentials and above. This change carries a per-MAU cost (~$0.015/MAU) above the 10,000 free monthly active users. The tier is set on the `aws_cognito_user_pool` resource.

### Branding API
`aws_cognito_managed_login_branding` (Terraform AWS provider ≥ v5) is used instead of the legacy `aws_cognito_user_pool_ui_customization`. The legacy resource only supports ~18 CSS class selectors with a restricted property whitelist; Managed Login supports full component-level theming via a structured JSON schema.

### Domain managed_login_version
Both the prefix-domain and custom-domain variants of `aws_cognito_user_pool_domain` will have `managed_login_version = 2` set explicitly. Value `1` is the classic Hosted UI; `2` is Managed Login.

### One-time re-authentication impact
Switching `managed_login_version` from 1 (or unset, which defaults to 1) to 2 causes a one-time forced re-authentication for all existing users. Their tokens remain valid, but the next time they visit the Hosted UI (e.g. after token expiry), they land on the Managed Login page instead of the classic UI. This is acceptable for Breadly's current user base.

### Theme specification
The branding settings JSON is written in Cognito's required 8-character RRGGBBAA hex colour format. The theme matches the Angular frontend's Tailwind palette:
- Primary action: `#2563eb` (Tailwind blue-600) / hover `#1d4ed8` (blue-700)
- Page background: `#f9fafb` (gray-50)
- Form card background: `#ffffff`, border `#e5e7eb` (gray-200)
- Body text: `#374151` (gray-700), headings `#111827` (gray-900)
- Input borders: `#d1d5db` (gray-300), focus ring `#2563eb`
- Error indicator: `#fef2f2` bg, `#fca5a5` border, `#b91c1c` icon (red-50 / red-300 / red-700)
- Links: `#2563eb`, hover `#1d4ed8`
- Button border radius: 6 px; form card border radius: 8 px

### Color scheme mode
LIGHT only (no dark/adaptive mode). The Angular app does not implement dark mode yet; adding it to the auth pages would create an inconsistency.

### Logo asset
A PNG logo is placed at `breadly-idp-ui/logo.png`. Terraform reads it with `filebase64()` inside the `aws_cognito_managed_login_branding` asset block (category `PAGE_HEADER_LOGO`, color_mode `LIGHT`). The logo asset block is wrapped in a `dynamic` block conditioned on the variable being non-empty, so the resource can be created before the real logo file is committed without failing the Terraform plan.

### Module structure (`breadly-idp-ui`)
A new root-level directory `breadly-idp-ui/` contains:
- `settings.json` — the complete Managed Login branding JSON
- `logo.png` — the logo image asset
- `breadly-idp-ui.iml` — IntelliJ module descriptor (WEB_MODULE, same pattern as `breadly-api.iml`)

The directory is registered in `.idea/modules.xml`.

### Terraform wiring
The existing `modules/cognito` module receives two new optional variables: `ui_settings` (JSON string) and `ui_logo_png` (base64 string). Root modules (`infrastructure/aws/deploy` and `infrastructure/aws/preview/gateway`) read the files from the `breadly-idp-ui` directory using relative paths anchored to `${path.module}`, following the precedent set by the scheduler module's `config_json` argument. The cognito module creates the branding resource when `ui_settings` is non-empty.

### Scope of branding per client
The `aws_cognito_managed_login_branding` resource targets the primary app client created by the cognito module. Per-branch preview clients (created in `preview/deploy`) inherit the pool-level branding set by the gateway stack and do not need separate branding resources.

## Testing Decisions

Good tests for this feature verify observable, user-facing behaviour — not Terraform resource attributes or JSON structure.

### Existing E2E test pattern
The E2E suite (`e2e/`) uses Playwright. Existing auth tests use Cognito's API directly (via `cognito-identity-js` SDK calls or the `initiateAuth` API) to avoid relying on the Hosted UI for speed and stability. This means the existing E2E tests will continue to pass unchanged — they bypass the Hosted UI entirely. No new automated test is needed for the branding itself.

### Manual verification checklist (run after each apply)
- Open the Hosted UI login URL directly and confirm: Breadly logo visible, blue sign-in button, styled inputs, correct background colour.
- Trigger a failed login and confirm the error alert uses the red-tinted style.
- Click "Forgot password" and confirm branding carries through to that page.
- Verify on the dev, prod, and at least one preview branch.

### Infrastructure-level testing
`terraform plan` output is the primary check that Terraform changes are safe. Expected diff on first apply: `aws_cognito_user_pool.this` (tier update), `aws_cognito_user_pool_domain.*` (managed_login_version), and `aws_cognito_managed_login_branding.this[0]` (new resource).

## Out of Scope

- **Dark mode / adaptive colour scheme** — the Angular app has no dark mode; this remains LIGHT only.
- **Page footer / header branding** — only the form card and page background are styled.
- **Custom authentication flow logic** — no Lambda triggers, no custom challenge flows, no text copy changes. The separate `custom-auth-ui.md` PRD covers a future full custom UI.
- **Social login button styling** — no identity providers are configured; the `idpButton` component is not relevant yet.
- **Per-environment theme differences** — all environments use the same `settings.json`.
- **Automated screenshot regression tests** — visual regression testing of the Hosted UI is out of scope.
- **Favicon customisation** — deferred; requires a separate asset and Cognito favicon configuration.

## Further Notes

- The AWS Cognito Managed Login Branding Editor in the console (Cognito → User pools → Branding) can be used to preview changes visually before committing them as JSON. Export the JSON from the editor and paste it into `settings.json`.
- Cognito's colour format is 8-character RRGGBBAA (not standard CSS hex). Always include the alpha channel (`ff` = fully opaque).
- The `managed_login_version` change on the domain resource is a non-destructive in-place update — the domain itself is not recreated, so no DNS changes or certificate re-validation is needed.
- The branding resource has a 2 MB API request size limit. Logo images should be kept well under 100 KB.

## Implementation Plan

### Files to Create

| Path | Description |
|------|-------------|
| `breadly-idp-ui/settings.json` | Cognito Managed Login branding JSON, generated from the color spec above |
| `breadly-idp-ui/logo.png` | Placeholder PNG committed immediately; replaced with real logo when ready |
| `breadly-idp-ui/breadly-idp-ui.iml` | IntelliJ WEB_MODULE descriptor (same pattern as `breadly-api/breadly-api.iml`) |

### Files to Modify

**`.idea/modules.xml`** — register the new IntelliJ module:
```xml
<module fileurl="file://$PROJECT_DIR$/breadly-idp-ui/breadly-idp-ui.iml" filepath="$PROJECT_DIR$/breadly-idp-ui/breadly-idp-ui.iml" />
```

**`infrastructure/aws/modules/cognito/variables.tf`** — add two optional variables:
```hcl
variable "ui_settings" {
  description = "Cognito Managed Login branding settings JSON string. When non-empty, creates the branding resource."
  type        = string
  default     = ""
}

variable "ui_logo_png" {
  description = "Base64-encoded PNG logo for the Managed Login page header. When non-empty, attaches as a PAGE_HEADER_LOGO asset."
  type        = string
  default     = ""
}
```

**`infrastructure/aws/modules/cognito/main.tf`** — three changes:

1. Add `user_pool_tier = "ESSENTIALS"` to `aws_cognito_user_pool.this`.
2. Add `managed_login_version = 2` to both `aws_cognito_user_pool_domain.this` and `aws_cognito_user_pool_domain.custom`.
3. Append a new branding resource:

```hcl
resource "aws_cognito_managed_login_branding" "this" {
  count = var.ui_settings != "" ? 1 : 0

  user_pool_id                = aws_cognito_user_pool.this.id
  client_id                   = aws_cognito_user_pool_client.this.id
  use_cognito_provided_values = false
  settings                    = var.ui_settings

  dynamic "assets" {
    for_each = var.ui_logo_png != "" ? [1] : []
    content {
      category   = "PAGE_HEADER_LOGO"
      color_mode = "LIGHT"
      extension  = "PNG"
      bytes      = var.ui_logo_png
    }
  }
}
```

**`infrastructure/aws/deploy/main.tf`** — add to `module "cognito"` (paths follow the scheduler module precedent):
```hcl
ui_settings = file("${path.module}/../../../breadly-idp-ui/settings.json")
ui_logo_png = fileexists("${path.module}/../../../breadly-idp-ui/logo.png") ? filebase64("${path.module}/../../../breadly-idp-ui/logo.png") : ""
```

**`infrastructure/aws/preview/gateway/main.tf`** — add to `module "cognito"` (one extra level deeper):
```hcl
ui_settings = file("${path.module}/../../../../breadly-idp-ui/settings.json")
ui_logo_png = fileexists("${path.module}/../../../../breadly-idp-ui/logo.png") ? filebase64("${path.module}/../../../../breadly-idp-ui/logo.png") : ""
```

No changes needed in `preview/deploy` — per-branch clients inherit pool-level branding from the gateway stack automatically.

### Path Reference

| Terraform root | Relative path to repo root | `breadly-idp-ui/` path |
|---|---|---|
| `infrastructure/aws/deploy/` | `../../..` | `${path.module}/../../../breadly-idp-ui/` |
| `infrastructure/aws/preview/gateway/` | `../../../..` | `${path.module}/../../../../breadly-idp-ui/` |

### Expected `terraform plan` Diff (first apply)

- `aws_cognito_user_pool.this` — `user_pool_tier`: `null` → `"ESSENTIALS"`
- `aws_cognito_user_pool_domain.this` or `.custom` — `managed_login_version`: `null` → `2`
- `aws_cognito_managed_login_branding.this[0]` — new resource
