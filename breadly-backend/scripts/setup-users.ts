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
import { Roles } from '../src/auth/roles.config.js';
import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminUpdateUserAttributesCommand,
  CreateGroupCommand,
  GetGroupCommand,
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
 * Central setup configuration.
 *
 * - Add a new group: append an entry to `groups`.
 * - Add a new user: append an entry to `users` and reference group names from
 *   the `groups` array in the `groups` field.
 *
 * This is the only object you need to touch for day-to-day user/group management.
 */
const SETUP_CONFIG: SetupConfig = {
  groups: Object.values(Roles).map((role) => ({
    name: role.name,
    description: role.description,
  })),
  users: [
    { email: 'admin@breadly.app', name: 'Admin User', description: 'Application admin', groups: [Roles.ADMIN.name] },
  ],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupDefinition {
  /** Cognito group name. Used as the unique identifier — keep it uppercase and stable. */
  name: string;
  /** Human-readable description stored in Cognito and shown during setup. */
  description: string;
}

interface UserDefinition {
  /** Cognito username — must match the email used in Terraform var.admin_email. */
  email: string;
  /** Display name stored as the Cognito `name` standard attribute. */
  name: string;
  /** Human-readable label shown during the setup prompts. */
  description: string;
  /** Names of groups (from SetupConfig.groups) this user must belong to. */
  groups: string[];
}

interface SetupConfig {
  groups: GroupDefinition[];
  users: UserDefinition[];
}

type Environment = 'dev' | 'prod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the Cognito User Pool name from the environment, matching Terraform naming. */
function userPoolName(env: Environment): string {
  return `${PROJECT_NAME}-${env}`;
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
// Per-group logic
// ---------------------------------------------------------------------------

/**
 * Ensure a Cognito group exists. If it already exists the call is a no-op.
 * Groups are never deleted or modified by this script.
 */
async function setupGroup(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  group: GroupDefinition,
): Promise<void> {
  console.log(`\n--- Group: ${group.name} ---`);

  try {
    await client.send(new GetGroupCommand({ UserPoolId: userPoolId, GroupName: group.name }));
    console.log(`  Already exists — skipped.`);
  } catch (err: unknown) {
    if (!isResourceNotFound(err)) throw err;

    await client.send(
      new CreateGroupCommand({
        UserPoolId: userPoolId,
        GroupName: group.name,
        Description: group.description,
      }),
    );
    console.log(`  Created.`);
  }
}

// ---------------------------------------------------------------------------
// Per-user group-membership sync
// ---------------------------------------------------------------------------

/**
 * Ensure the user belongs to every group listed in their definition.
 * This is non-destructive — existing memberships that are not in the list are
 * left untouched.  Re-running the script is always safe.
 */
async function syncUserGroups(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  user: UserDefinition,
): Promise<void> {
  if (user.groups.length === 0) return;

  // Fetch the current group memberships for this user.
  const response = await client.send(
    new AdminListGroupsForUserCommand({ UserPoolId: userPoolId, Username: user.email }),
  );
  const currentGroups = new Set((response.Groups ?? []).map((g) => g.GroupName));

  for (const groupName of user.groups) {
    if (currentGroups.has(groupName)) {
      console.log(`  Group ${groupName}: already a member.`);
    } else {
      await client.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: user.email,
          GroupName: groupName,
        }),
      );
      console.log(`  Group ${groupName}: added.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Per-user logic
// ---------------------------------------------------------------------------

async function setupUser(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  user: UserDefinition,
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
      console.log('  Password unchanged.');
      // Still sync group memberships even if password is skipped.
      await syncUserGroups(client, userPoolId, user);
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
          { Name: 'name', Value: user.name },
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

  // Ensure the display name is up to date (handles pre-existing users).
  await client.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: user.email,
      UserAttributes: [{ Name: 'name', Value: user.name }],
    }),
  );

  // Always sync group memberships after password setup.
  await syncUserGroups(client, userPoolId, user);
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

  // Validate that every group name referenced in users exists in the groups list.
  const definedGroupNames = new Set(SETUP_CONFIG.groups.map((g) => g.name));
  for (const user of SETUP_CONFIG.users) {
    for (const groupName of user.groups) {
      if (!definedGroupNames.has(groupName)) {
        console.error(
          `Configuration error: user "${user.email}" references unknown group "${groupName}".`,
        );
        console.error(`Defined groups: ${[...definedGroupNames].join(', ')}`);
        process.exit(1);
      }
    }
  }

  const poolName = userPoolName(env);
  console.log(`\nSetting up groups and users for environment: ${env}`);
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

  // 1. Ensure all groups exist before touching any user.
  console.log('\n== Groups ==');
  for (const group of SETUP_CONFIG.groups) {
    await setupGroup(client, userPoolId, group);
  }

  // 2. Process each user (password setup + group membership sync).
  console.log('\n== Users ==');
  for (const user of SETUP_CONFIG.users) {
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

function isResourceNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'ResourceNotFoundException'
  );
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
