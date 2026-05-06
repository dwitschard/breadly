# PRD: Custom Authentication UI

## Problem Statement

Breadly currently authenticates users by redirecting them to Amazon Cognito's Hosted UI. This creates several problems:

- The login/registration experience is visually disconnected from the rest of the application. Users leave the Breadly domain, see Cognito's default UI (or a minimally themed version), and are redirected back. This feels generic and erodes trust.
- The Hosted UI provides no control over the authentication flow UX. Error messages, field validation, loading states, and flow transitions are all dictated by Cognito's built-in screens. Customisation is limited to CSS and a logo.
- Adding new authentication features (email verification prompts, force-change-password for admin-created users, inline password reset) requires workarounds or is impossible within the Hosted UI's constraints.
- The redirect-based flow causes a full page reload on every authentication event, creating a jarring user experience compared to an in-app flow.

## Solution

Replace the Cognito Hosted UI redirect with a fully custom authentication UI built in the Angular frontend. Users will log in, register, verify their email, reset their password, and handle force-change-password flows entirely within the Breadly application.

The solution uses two authentication mechanisms:

1. **Email/password authentication** uses `amazon-cognito-identity-js`, which communicates directly with the Cognito User Pool via the SRP (Secure Remote Password) protocol. No redirect is involved. The user stays in the application throughout the entire flow.

2. **Social login (Apple)** uses an OAuth redirect flow with PKCE through Cognito's `/oauth2/authorize` endpoint. The `identity_provider=SignInWithApple` parameter causes Cognito to skip its Hosted UI and redirect the user directly to Apple's consent screen. After Apple authenticates the user, Cognito redirects back to the application's callback route, where the frontend exchanges the authorization code for tokens.

Both mechanisms produce identical Cognito JWTs. The backend, API Gateway, and all existing protected routes continue to work without modification.

## User Stories

1. As a new user, I want to register with my email and password on a branded Breadly page, so that I feel confident I'm signing up for the right service.

2. As a new user, I want to see inline validation errors (e.g., "Password must be at least 8 characters") as I fill out the registration form, so that I can correct mistakes before submitting.

3. As a new user, I want to receive a verification code by email after registering and enter it on a confirmation page within the app, so that I can verify my email without leaving Breadly.

4. As a new user, I want the option to request a new verification code if the original one expired or was never received, so that I'm not locked out of the verification flow.

5. As a returning user, I want to log in with my email and password on a branded Breadly page, so that I have a consistent, familiar experience every time.

6. As a returning user, I want to see a clear error message when my credentials are incorrect, so that I know what went wrong and can try again.

7. As a user, I want to sign in with my Apple account using a single button, so that I don't have to create and remember a separate password.

8. As a user signing in with Apple, I want to be redirected directly to Apple's consent screen (not Cognito's Hosted UI), so that the experience feels native and trustworthy.

9. As a user who signed in with Apple, I want to be redirected back to the application and logged in automatically, so that the social login flow is seamless.

10. As a user who forgot my password, I want to request a password reset code on a "Forgot Password" page, so that I can recover access to my account without contacting support.

11. As a user who requested a password reset, I want to enter my reset code and a new password on a dedicated page, so that I can complete the reset flow within the app.

12. As an admin-created user with a temporary password, I want to be prompted to set a permanent password on a dedicated page, so that I can activate my account without confusion.

13. As a user on any auth page, I want to navigate between login, registration, and forgot-password pages via links, so that I can reach the right flow without using the browser's back button.

14. As a user on any auth page, I want the page to be fully accessible (keyboard navigable, screen reader compatible, proper focus management), so that I can use the application regardless of ability.

15. As a user on a mobile device, I want the auth pages to be fully responsive and usable, so that I can authenticate from any device.

16. As an authenticated user, I want my session to persist across page reloads (via refresh tokens), so that I don't have to log in again every time I revisit the application.

17. As an authenticated user, I want my session to end cleanly when I click "Log out", so that my tokens are revoked and I'm returned to a logged-out state.

18. As an authenticated user whose access token has expired, I want the application to silently refresh my token in the background, so that I'm not interrupted while using the app.

19. As a user who is forcibly logged out (e.g., session invalidated server-side), I want to be redirected to the login page with a clear message, so that I understand what happened.

20. As a developer, I want all auth-related strings to be in the translation file (German), so that the auth UI is consistent with the rest of the internationalised application.

21. As a developer, I want all auth pages to follow the smart/dumb component split, so that the auth UI is testable and maintainable.

22. As a developer, I want a shared form-field component that handles labels, inputs, and validation error display, so that all auth forms (and future forms) have consistent UX and accessibility.

23. As a developer, I want the auth module to expose the same public API (`isLoggedIn`, `login`, `logout`, `clearLocalSession`) regardless of the underlying auth mechanism, so that consumers of `AuthService` don't need to change.

24. As a developer, I want the Terraform configuration to include the Apple identity provider on the Cognito User Pool, so that Apple Sign-In works without manual AWS console setup.

## Implementation Decisions

### Library Replacement

The `angular-oauth2-oidc` library is fully removed and replaced with `amazon-cognito-identity-js`. This is not a hybrid approach; the old library is uninstalled and all references are deleted.

`angular-oauth2-oidc` cannot be used for a custom login UI with Cognito because Cognito's `/oauth2/token` endpoint does not support the Resource Owner Password Credentials (ROPC) grant type (`grant_type=password`). The only way to authenticate with email/password against a Cognito User Pool without a redirect is through Cognito's native SRP-based `InitiateAuth` API, which `amazon-cognito-identity-js` wraps.

### Authentication Architecture

Two services handle the two authentication mechanisms:

**`CognitoService`** wraps `amazon-cognito-identity-js` and handles all email/password flows:
- Sign up (returns user sub, triggers Cognito's email verification)
- Confirm sign up (verification code)
- Resend confirmation code
- Sign in (SRP authentication, returns tokens)
- Handle "new password required" challenge (force-change-password)
- Forgot password (triggers Cognito's password reset email)
- Confirm forgot password (reset code + new password)
- Get current session (cached tokens with automatic refresh)
- Sign out (local token clearing + optional Cognito global sign-out)

This service initialises a `CognitoUserPool` instance using `userPoolId` and `clientId` parsed from the existing runtime config.

**`SocialAuthService`** handles Apple Sign-In via OAuth redirect with PKCE:
- Generates a cryptographic code verifier and challenge using the Web Crypto API (~50 lines)
- Constructs the Cognito `/oauth2/authorize` URL with `identity_provider=SignInWithApple`, the PKCE challenge, and the callback URL
- Redirects the user to this URL (which goes directly to Apple, bypassing the Cognito Hosted UI)
- On callback, exchanges the authorization code for tokens via POST to Cognito's `/oauth2/token` endpoint
- Stores and retrieves the PKCE code verifier in `sessionStorage` across the redirect

No OIDC library is needed for social login. The PKCE flow is implemented manually because it requires only: generating a random string, SHA-256 hashing it, and making a single POST request for token exchange.

**`AuthService`** is the public facade that consumers (guards, interceptors, navbar, home page) use. Its public API (`isLoggedIn`, `login`, `logout`, `clearLocalSession`) remains unchanged. Internally, it delegates to `CognitoService` for session management and token retrieval.

### Token Attachment

The current `provideOAuthClient` from `angular-oauth2-oidc` automatically attaches Bearer tokens to API requests. This is replaced with a simple `HttpInterceptorFn` (`auth-token.interceptor.ts`) that:
- Reads the access token from `CognitoService.getAccessToken()`
- Attaches it as `Authorization: Bearer <token>` to requests matching the `api/` URL prefix
- Passes through requests that don't match

### Config Service Extension

The existing `ConfigService` returns `{ issuer, clientId }` from the `/api/public/config` endpoint. The issuer URL format is `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`.

The `ConfigService` is extended with two computed properties:
- `userPoolId` — parsed from the issuer URL
- `region` — parsed from the issuer URL

No backend or OpenAPI changes are needed for this. The parsing happens entirely in the frontend.

For social login, the Cognito Hosted UI domain URL is needed to construct the `/oauth2/authorize` endpoint. This domain is either:
- Exposed as a new field on the `/api/public/config` response (requires OpenAPI + backend change), OR
- Derived from the existing config (the format is predictable: `<pool-name>.auth.<region>.amazoncognito.com`)

The preferred approach is to expose it via the config endpoint, because deriving it requires knowing the pool name which is an infrastructure detail the frontend should not assume.

### Auth Pages and Component Architecture

Auth pages follow the standard smart/dumb split. Each auth flow gets a page (smart) and a form component (dumb):

| Flow | Page (smart) | Form Component (dumb) |
|------|-------------|----------------------|
| Login | `login.page.ts` | `login-form.component.ts` |
| Register | `register.page.ts` | `register-form.component.ts` |
| Confirm Email | `confirm-email.page.ts` | `confirm-email-form.component.ts` |
| Forgot Password | `forgot-password.page.ts` | `forgot-password-form.component.ts` |
| Reset Password | `reset-password.page.ts` | `reset-password-form.component.ts` |
| Force Change Password | `force-change-password.page.ts` | `force-change-password-form.component.ts` |

Pages inject services, handle form submission, manage loading/error state, and navigate between flows. Form components receive data via `input()`, emit events via `output()`, and contain no injected services.

A shared `auth-card.component.ts` provides the centered card layout used by all auth pages. Auth pages render outside the main layout shell (no navbar).

### Shared Form Field Component

The `form-field.component.ts` referenced in the frontend AGENTS.md does not exist yet. It is created as part of this work. This component:
- Accepts a label, form control, and error messages
- Renders the label, input slot (via `ng-content`), and validation errors
- Sets `aria-describedby` and `aria-invalid` for accessibility
- Is used by all auth forms and available for all future forms

### Auth Routes

Auth routes are defined in `auth/auth.routes.ts` as a sub-router:

| Path | Component |
|------|-----------|
| `/login` | `LoginPageComponent` |
| `/register` | `RegisterPageComponent` |
| `/confirm-email` | `ConfirmEmailPageComponent` |
| `/forgot-password` | `ForgotPasswordPageComponent` |
| `/reset-password` | `ResetPasswordPageComponent` |
| `/force-change-password` | `ForceChangePasswordPageComponent` |
| `/oidc-callback` | `CallbackComponent` (social login return only) |

The `app.routes.ts` is updated to use `loadChildren` for the auth sub-router. The `/oidc-callback` route is kept but only handles social login redirects.

### Backend and API Changes

Email/password authentication requires zero backend or API changes. The JWTs produced by `amazon-cognito-identity-js`'s SRP flow are identical to those produced by the Hosted UI's code flow. The API Gateway JWT authorizer and the backend `requireAuth()` middleware validate them the same way.

If the Cognito Hosted UI domain needs to be exposed in the public config endpoint, a small addition to the `PublicConfig` schema in `openapi.yaml` and the backend `public.controller.ts` is needed. This is the only potential API change.

### Infrastructure: Apple Identity Provider

The Terraform Cognito module is extended with:

1. **`aws_cognito_identity_provider`** resource for Apple:
   - Provider type: `SignInWithApple`
   - Provider details: team ID, service ID, key ID, private key (sourced from variables, stored in SSM/Secrets Manager)
   - Attribute mapping: Apple claims mapped to Cognito standard attributes (email, name)

2. **Updated `aws_cognito_user_pool_client`**:
   - `supported_identity_providers` changed from `["COGNITO"]` to `["COGNITO", "SignInWithApple"]`
   - May need `"profile"` added to `allowed_oauth_scopes`

3. **New variables** for Apple credentials (team ID, service ID, key ID, private key)

The Cognito Hosted UI domain and `ALLOW_USER_SRP_AUTH` explicit auth flow are already provisioned and require no changes.

### Session and Token Management

- **Access tokens** (1-hour expiry): stored in memory by `amazon-cognito-identity-js` (which uses localStorage internally for the `CognitoUser` session)
- **Refresh tokens** (30-day expiry): stored by `amazon-cognito-identity-js` in localStorage, used automatically for silent session refresh
- **Token refresh**: `amazon-cognito-identity-js` handles refresh automatically when `getSession()` is called and the access token is expired but the refresh token is valid
- **Logout**: clears the local `CognitoUser` session (tokens removed from localStorage)

### Translations

Approximately 30 new keys are added to `de.json` under the `AUTH` section, covering all auth form labels, buttons, validation messages, and error messages. The existing 3 AUTH keys (login title, logout title, logout message) are preserved and extended.

## Testing Decisions

### What Makes a Good Test

Tests should validate external behaviour (inputs and outputs) rather than implementation details. For services, this means: "given these inputs, the service exposes these signals/values." For components, this means: "given these inputs, the template renders this content; given this user interaction, the component emits this output." Tests should not assert internal method calls, private signal values, or the order of operations within a method.

### Modules to Test

**Services (unit tests):**
- `cognito.service.ts` — mock `amazon-cognito-identity-js` classes (`CognitoUserPool`, `CognitoUser`, `AuthenticationDetails`), test all auth flows (sign up, confirm, sign in, forgot password, etc.), verify signal state changes and error handling
- `social-auth.service.ts` — mock `window.crypto.subtle` and `fetch`, test PKCE generation, URL construction, token exchange, and error cases
- `auth.service.ts` — mock `CognitoService` and `SocialAuthService`, test that the public API facade delegates correctly, verify `isLoggedIn` signal transitions
- `auth-token.interceptor.ts` — test token attachment for `api/` requests, passthrough for non-API requests, handling of missing tokens

**Pages (unit tests):**
- `login.page.ts` — mock `AuthService` and `CognitoService`, test form submission handling, error state display, navigation to register/forgot-password
- `register.page.ts` — test form submission, navigation to confirm-email on success, error handling
- `confirm-email.page.ts` — test code submission, resend code, navigation to login on success
- `forgot-password.page.ts` — test email submission, navigation to reset-password on success
- `reset-password.page.ts` — test code + new password submission, navigation to login on success
- `force-change-password.page.ts` — test new password submission, navigation to home on success

**Components (unit tests):**
- `login-form.component.ts` — test input rendering, output emission on submit, Apple sign-in button
- `register-form.component.ts` — test input rendering, output emission
- `confirm-email-form.component.ts` — test code input, resend button output
- `forgot-password-form.component.ts` — test email input, output emission
- `reset-password-form.component.ts` — test code + password inputs, output emission
- `force-change-password-form.component.ts` — test password inputs, output emission
- `auth-card.component.ts` — test title rendering, content projection
- `form-field.component.ts` — test label rendering, error display, accessibility attributes

**Prior art:** Existing component tests use Vitest with Angular TestBed. Service tests mock injected dependencies and assert signal values.

## Out of Scope

- **Multi-factor authentication (MFA/TOTP)**: Not included in this feature. Can be added later by extending `CognitoService` to handle the `SMS_MFA` or `SOFTWARE_TOKEN_MFA` challenges.
- **Google social login**: Only Apple is implemented. Adding Google would follow the same pattern (new Cognito identity provider + redirect flow) but is a separate effort.
- **Remember me / device tracking**: Cognito supports device tracking and "remember this device" functionality, but it adds complexity and is not in scope.
- **Account deletion from the UI**: Users cannot delete their own accounts. Account management is admin-only.
- **Username-based login**: Only email/password is supported. Cognito's "username" attribute is the email.
- **Custom email templates**: Cognito sends its default verification and password reset emails. Custom email templates (SES integration) are a separate effort.
- **Password strength meter**: Forms enforce Cognito's password policy (min 8 chars, uppercase, lowercase, numbers) via frontend validation, but do not display a strength meter.
- **Dark mode**: Not in scope for the application (per AGENTS.md).
- **Rate limiting / brute force protection**: Handled by Cognito natively (account lockout after failed attempts). No frontend implementation needed.

## Further Notes

- **Vendor lock-in**: This approach ties the frontend to Amazon Cognito's SDK and API. Switching to a different identity provider (Auth0, Firebase Auth, Keycloak) would require rewriting `CognitoService` and `SocialAuthService`. The `AuthService` facade partially mitigates this by abstracting the public API, but the underlying services are Cognito-specific. This trade-off was explicitly accepted.
- **Code volume**: The implementation adds approximately 20-25 new files to the frontend auth module. This is more auth code to maintain compared to the Hosted UI approach (which had ~5 files). The trade-off is full control over the UX.
- **`angular-oauth2-oidc` removal is clean**: The library is used in exactly 5 files (`auth.service.ts`, `auth.service.spec.ts`, `auth.config.ts`, `app.config.ts`, `app.spec.ts`). No other code references it. Removal is straightforward.
- **Cognito handles all server-side concerns**: Email delivery (verification codes, password reset codes), password policy enforcement, account lockout, token issuance/signing/refresh, and user pool group management are all handled by Cognito. The frontend only presents the UI and forwards user input to the SDK.
- **Social login callback URL**: The existing `/oidc-callback` path is reused for social login returns. The Cognito app client's callback URLs are already configured with this path. No infrastructure change is needed for the callback URL itself.
- **Profile schema compatibility**: The existing `Profile` OpenAPI schema already includes `name`, `givenName`, `familyName`, and `picture` fields, which are the claims that Apple Sign-In can provide. No schema changes are needed for social login profile data.
- **`form-field.component.ts` is a prerequisite**: This shared component does not exist yet but is referenced in the frontend AGENTS.md as part of the standard component library. Creating it as part of this work benefits the entire application, not just auth forms.
