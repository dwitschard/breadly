/**
 * setup-users.ts — Activate pre-provisioned Cognito admin users.
 *
 * Terraform creates admin accounts in FORCE_CHANGE_PASSWORD status using a
 * random placeholder password that is never revealed.  This script sets a
 * real, permanent password so the account can be used to log in.
 *
 * Self-registered users (anyone not listed in ADMIN_USERS below) are NEVER
 * touched by this script.
 *
 * Usage (from breadly-backend/scripts/):
 *   npm run setup-users:dev
 *   npm run setup-users:staging
 *   npm run setup-users:prod
 *
 * Prerequisites:
 *   • AWS CLI configured with credentials that have Cognito admin permissions
 *     (e.g. `aws sso login --profile <profile>`, or env vars AWS_PROFILE /
 *     AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_SESSION_TOKEN).
 *   • The target environment must have been deployed via Terraform at least once
 *     so the User Pool exists.
 *
 * Security guarantees:
 *   • The password is prompted interactively with echo disabled — it never
 *     appears on screen, in a file, or in a shell history.
 *   • The password is passed directly to the AWS SDK call over TLS; AWS
 *     Cognito stores only a salted hash — never plaintext.
 *   • No secret is written to disk, environment variables, or log output.
 */

import readline from 'node:readline';
import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
  UserStatusType,
} from '@aws-sdk/client-cognito-identity-provider';

// ---------------------------------------------------------------------------
// Configuration — adapt this section for each project / environment.
// ---------------------------------------------------------------------------

/** Project name prefix as defined in Terraform's var.project_name. */
const PROJECT_NAME = 'breadly';

/** AWS region where the Cognito User Pool lives. */
const AWS_REGION = 'eu-central-1';

/**
 * Admin users managed by this script.
 * Add or remove entries here to adapt to your team.
 * Only these emails will ever be created or updated — all other users in the
 * pool are left completely untouched.
 */
const ADMIN_USERS: AdminUser[] = [
  { email: 'admin@breadly.app', description: 'Application admin' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminUser {
  /** Cognito username — must match the email used in Terraform var.admin_email. */
  email: string;
  /** Human-readable label shown during the setup prompts. */
  description: string;
}

type Environment = 'dev' | 'prod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the Cognito User Pool name from the environment, matching Terraform naming. */
function userPoolName(env: Environment): string {
  return `${PROJECT_NAME}-${env}-backend`;
}

/**
 * Prompt the user for input on the terminal.
 * When `silent` is true the typed characters are not echoed (for passwords).
 */
async function prompt(question: string, silent = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    if (silent) {
      // Write the question manually; suppress readline's own output.
      process.stdout.write(question);

      // Temporarily replace the _writeToOutput method so readline does not
      // echo the characters the user types.
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
        () => undefined;
    }

    rl.question(silent ? '' : question, (answer) => {
      rl.close();
      if (silent) {
        // Move to next line after hidden input.
        process.stdout.write('\n');
      }
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt for a password twice and return it only when both entries match.
 * Loops until they do.
 */
async function promptPassword(label: string): Promise<string> {
  while (true) {
    process.stdout.write(`  Enter password for ${label}: `);
    const pw1 = await prompt('', true);
    if (pw1.length === 0) {
      console.error('  Password must not be empty. Try again.');
      continue;
    }
    process.stdout.write('  Confirm password: ');
    const pw2 = await prompt('', true);
    if (pw1 === pw2) {
      return pw1;
    }
    console.error('  Passwords do not match. Try again.\n');
  }
}

/**
 * Find a User Pool by its name.
 * Lists pools in pages of 60 until the name is found or all pages are exhausted.
 */
async function findUserPoolId(
  client: CognitoIdentityProviderClient,
  poolName: string,
): Promise<string> {
  let nextToken: string | undefined;

  do {
    const response = await client.send(
      new ListUserPoolsCommand({ MaxResults: 60, NextToken: nextToken }),
    );

    const match = response.UserPools?.find((p) => p.Name === poolName);
    if (match?.Id) {
      return match.Id;
    }

    nextToken = response.NextToken;
  } while (nextToken);

  throw new Error(
    `No Cognito User Pool named "${poolName}" found in ${AWS_REGION}.\n` +
      `Make sure Terraform has been applied for the "${poolName.replace(`${PROJECT_NAME}-`, '').replace('-backend', '')}" environment.`,
  );
}

// ---------------------------------------------------------------------------
// Per-user logic
// ---------------------------------------------------------------------------

async function setupUser(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  user: AdminUser,
): Promise<void> {
  console.log(`\n--- ${user.description} (${user.email}) ---`);

  // Check whether the user already exists in the pool.
  let existingStatus: UserStatusType | undefined;
  try {
    const existing = await client.send(
      new AdminGetUserCommand({ UserPoolId: userPoolId, Username: user.email }),
    );
    existingStatus = existing.UserStatus;
  } catch (err: unknown) {
    if (isNotFound(err)) {
      existingStatus = undefined; // user does not exist yet
    } else {
      throw err;
    }
  }

  if (existingStatus === UserStatusType.CONFIRMED) {
    // User is already active — ask before overwriting.
    console.log(`  Status: CONFIRMED (account is already active)`);
    const answer = await prompt('  Reset password for this user? [y/N] ');
    if (answer.toLowerCase() !== 'y') {
      console.log('  Skipped.');
      return;
    }
  } else if (existingStatus === undefined) {
    // User does not exist — create it first.
    console.log('  User not found in pool — creating...');
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: user.email,
        // Do not send a welcome email; we are setting the password right away.
        MessageAction: MessageActionType.SUPPRESS,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' },
        ],
      }),
    );
    console.log('  User created.');
  } else {
    // User exists in FORCE_CHANGE_PASSWORD (Terraform placeholder) or similar.
    console.log(`  Status: ${existingStatus} — activating account.`);
  }

  // Prompt for password and set it as permanent (bypasses FORCE_CHANGE_PASSWORD).
  const password = await promptPassword(user.email);

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      Password: password,
      Permanent: true, // Puts the user directly into CONFIRMED status.
    }),
  );

  console.log(`  Done — account is now active and can log in.`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const env = process.argv[2] as Environment | undefined;

  if (!env || !['dev', 'staging', 'prod'].includes(env)) {
    console.error('Usage: npm run setup-users -- <env>');
    console.error('       env must be one of: dev, staging, prod');
    process.exit(1);
  }

  const poolName = userPoolName(env);
  console.log(`\nSetting up admin users for environment: ${env}`);
  console.log(`Target User Pool: ${poolName} (${AWS_REGION})`);
  console.log('AWS credentials are taken from the default credential chain');
  console.log('(~/.aws/credentials, AWS_PROFILE, or environment variables).\n');

  const client = new CognitoIdentityProviderClient({ region: AWS_REGION });

  // Resolve the User Pool ID from its name — no IDs hardcoded in this file.
  let userPoolId: string;
  try {
    userPoolId = await findUserPoolId(client, poolName);
  } catch (err: unknown) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
  console.log(`Resolved User Pool ID: ${userPoolId}`);

  // Process each admin user in sequence so prompts don't interleave.
  for (const user of ADMIN_USERS) {
    await setupUser(client, userPoolId, user);
  }

  console.log('\nAll done.');
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'UserNotFoundException'
  );
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
