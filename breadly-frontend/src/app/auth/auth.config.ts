import { AuthConfig } from 'angular-oauth2-oidc';

export function buildAuthConfig(issuer: string, clientId: string): AuthConfig {
  return {
    issuer,
    clientId,
    responseType: 'code',
    redirectUri: `${document.baseURI}oidc-callback`,
    scope: 'openid email profile',
    timeoutFactor: 0.75,
    nonceStateSeparator: '___',

    strictDiscoveryDocumentValidation: false,
    showDebugInformation: false,
  };
}
