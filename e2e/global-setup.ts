import 'dotenv/config';
import {
  authenticateWithCognito,
  buildStorageState,
  writeStorageState,
} from './helpers/cognito.helper';

interface UserConfig {
  username: string;
  password: string;
  storagePath: string;
}

async function globalSetup(): Promise<void> {
  const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
  const region = process.env['E2E_AWS_REGION'] ?? 'eu-central-1';
  const userPoolClientId = process.env['E2E_COGNITO_CLIENT_ID'] ?? '';

  if (!userPoolClientId) {
    console.warn(
      'E2E_COGNITO_CLIENT_ID not set — skipping programmatic auth. ' +
        'Tests requiring authentication will fail.',
    );
    return;
  }

  const users: UserConfig[] = [
    {
      username: process.env['E2E_DEMO_USERNAME'] ?? 'demo@breadly.app',
      password: process.env['E2E_DEMO_PASSWORD'] ?? '',
      storagePath: '.auth/user.json',
    },
    {
      username: process.env['E2E_ADMIN_USERNAME'] ?? 'admin@breadly.app',
      password: process.env['E2E_ADMIN_PASSWORD'] ?? '',
      storagePath: '.auth/admin.json',
    },
  ];

  for (const user of users) {
    if (!user.password) {
      console.warn(
        `Password not set for ${user.username} — skipping. ` +
          'Tests requiring this user will fail.',
      );
      continue;
    }

    const tokens = await authenticateWithCognito({
      region,
      userPoolClientId,
      username: user.username,
      password: user.password,
    });

    const storageState = buildStorageState(tokens, baseURL);
    writeStorageState(storageState, user.storagePath);
  }
}

export default globalSetup;
