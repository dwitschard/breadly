import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import fs from 'node:fs';
import path from 'node:path';

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  expiresIn: number;
}

export interface CognitoAuthConfig {
  region: string;
  userPoolClientId: string;
  username: string;
  password: string;
}

export async function authenticateWithCognito(
  config: CognitoAuthConfig,
): Promise<CognitoTokens> {
  const client = new CognitoIdentityProviderClient({ region: config.region });

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.userPoolClientId,
    AuthParameters: {
      USERNAME: config.username,
      PASSWORD: config.password,
    },
  });

  const response = await client.send(command);

  const result = response.AuthenticationResult;
  if (!result?.IdToken || !result?.AccessToken) {
    throw new Error(
      `Cognito authentication failed for ${config.username}: no tokens returned`,
    );
  }

  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    expiresIn: result.ExpiresIn ?? 3600,
  };
}

export interface StorageStateEntry {
  name: string;
  value: string;
}

export function buildStorageState(
  tokens: CognitoTokens,
  baseURL: string,
): { cookies: []; origins: { origin: string; localStorage: StorageStateEntry[] }[] } {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;

  const localStorage: StorageStateEntry[] = [
    { name: 'access_token', value: tokens.accessToken },
    { name: 'id_token', value: tokens.idToken },
    { name: 'expires_at', value: String(expiresAt) },
    { name: 'granted_scopes', value: 'openid email' },
    { name: 'access_token_stored_at', value: String(Date.now()) },
    { name: 'id_token_stored_at', value: String(Date.now()) },
    { name: 'id_token_expires_at', value: String(expiresAt) },
  ];

  const origin = new URL(baseURL).origin;

  return {
    cookies: [],
    origins: [{ origin, localStorage }],
  };
}

export function writeStorageState(
  storageState: ReturnType<typeof buildStorageState>,
  filePath: string,
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(storageState, null, 2));
}

export async function warmUpHealthCheck(
  baseURL: string,
  maxRetries = 5,
  delayMs = 2000,
): Promise<void> {
  const normalizedBase = baseURL.replace(/\/+$/, '');
  const healthUrl = `${normalizedBase}/api/health`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        console.log(`Health check passed: ${healthUrl}`);
        return;
      }
      console.warn(
        `Health check attempt ${attempt}/${maxRetries} returned ${response.status}`,
      );
    } catch {
      console.warn(
        `Health check attempt ${attempt}/${maxRetries} failed (connection error)`,
      );
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.warn(
    `Health check at ${healthUrl} failed after ${maxRetries} attempts — continuing anyway. ` +
      'Tests will fail if the backend is unreachable.',
  );
}
