import 'dotenv/config';
import {
  authenticateWithCognito,
  buildStorageState,
  writeStorageState,
} from './helpers/cognito.helper';

async function globalSetup(): Promise<void> {
  const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
  const region = process.env['E2E_AWS_REGION'] ?? 'eu-central-1';
  const userPoolClientId = process.env['E2E_COGNITO_CLIENT_ID'] ?? '';
  const username = process.env['E2E_DEMO_USERNAME'] ?? 'demo@breadly.app';
  const password = process.env['E2E_DEMO_PASSWORD'] ?? '';

  if (!userPoolClientId) {
    console.warn(
      'E2E_COGNITO_CLIENT_ID not set — skipping programmatic auth. ' +
        'Tests requiring authentication will fail.',
    );
    return;
  }

  if (!password) {
    console.warn(
      'E2E_DEMO_PASSWORD not set — skipping programmatic auth. ' +
        'Tests requiring authentication will fail.',
    );
    return;
  }

  const tokens = await authenticateWithCognito({
    region,
    userPoolClientId,
    username,
    password,
  });

  const storageState = buildStorageState(tokens, baseURL);
  writeStorageState(storageState, '.auth/user.json');
}

export default globalSetup;
