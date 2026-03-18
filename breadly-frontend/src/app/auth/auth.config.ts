import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_sejixpckM',
  clientId: '5s0v9deb0i100s4egsgdec88ni',
  responseType: 'code',
  redirectUri: window.location.origin,
  scope: 'openid email',

  redirectUriAsPostLogoutRedirectUriFallback: false,

  strictDiscoveryDocumentValidation: false,
  showDebugInformation: false,
};
