import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.cognito.issuer,
  clientId: environment.cognito.clientId,
  responseType: 'code',
  redirectUri: `${window.location.origin}/oidc-callback`,
  scope: 'openid email',
  timeoutFactor: 0.75,

  strictDiscoveryDocumentValidation: false,
  showDebugInformation: false,
};
