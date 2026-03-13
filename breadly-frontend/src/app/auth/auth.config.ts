import { AuthConfig } from 'angular-oauth2-oidc';

// ---------------------------------------------------------------------------
// Cognito OIDC configuration
//
// Fill in the values from `terraform output` after provisioning:
//   issuer    → https://cognito-idp.<region>.amazonaws.com/<cognito_user_pool_id>
//   clientId  → <cognito_user_pool_client_id>
// ---------------------------------------------------------------------------

export const authConfig: AuthConfig = {
  issuer: 'https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_sejixpckM',
  clientId: '5s0v9deb0i100s4egsgdec88ni',
  responseType: 'code',
  redirectUri: window.location.origin,
  scope: 'openid email',

  // Cognito's discovery document omits optional OIDC fields (e.g. end_session_endpoint).
  // Disable strict validation to prevent the library from rejecting the document.
  strictDiscoveryDocumentValidation: false,

  showDebugInformation: false,
};
