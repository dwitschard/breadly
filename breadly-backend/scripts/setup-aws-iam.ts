/**
 * setup-aws-iam.ts — Provision account-level IAM resources for Breadly.
 *
 * Creates the IAM user and role required before any environment is deployed.
 * Safe to re-run at any time — all operations are idempotent (create-if-missing,
 * upsert inline policy).
 *
 * Resources managed:
 *   • IAM User:  local-dynamodb-user   (inline policy: dynamodb-local-table)
 *   • IAM Role:  Github-Deployer       (inline policy: Github_Deployer_Policy)
 *   • OIDC Provider: token.actions.githubusercontent.com  (created if absent)
 *
 * Usage (from breadly-backend/scripts/):
 *   npm run setup-aws-iam
 *
 * Prerequisites:
 *   • AWS CLI configured with credentials that have IAM admin permissions
 *     (e.g. `aws sso login --profile <profile>`, or env vars AWS_ACCESS_KEY_ID
 *     + AWS_SECRET_ACCESS_KEY + AWS_SESSION_TOKEN).
 *
 * Access keys:
 *   • Any existing access keys for local-dynamodb-user are deleted and a fresh
 *     key is created on every run. Copy it immediately — AWS will never show
 *     the secret again.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IAMClient,
  GetUserCommand,
  CreateUserCommand,
  PutUserPolicyCommand,
  ListAccessKeysCommand,
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand,
  GetRoleCommand,
  CreateRoleCommand,
  PutRolePolicyCommand,
  ListOpenIDConnectProvidersCommand,
  CreateOpenIDConnectProviderCommand,
} from '@aws-sdk/client-iam';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AWS_REGION = 'eu-central-1';

const GITHUB_OIDC_URL = 'token.actions.githubusercontent.com';
// SHA-1 thumbprint of the GitHub Actions OIDC TLS certificate root CA.
// Verify at: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc_verify-thumbprint.html
const GITHUB_OIDC_THUMBPRINT = '6938fd4d98bab03faadb97b34396831e3780aea1';

const IAM_CONFIG: IamConfig = {
  users: [
    {
      name: 'local-dynamodb-user',
      policyName: 'dynamodb-local-table',
      policyFile: 'dynamodb-local-table.json',
    },
  ],
  roles: [
    {
      name: 'Github-Deployer',
      policyName: 'Github_Deployer_Policy',
      policyFile: 'github-deployer-policy.json',
      trustFile: 'github-deployer-trust.json',
      updatePolicyOnly: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IamUserDefinition {
  name: string;
  policyName: string;
  policyFile: string;
}

interface IamRoleDefinition {
  name: string;
  policyName: string;
  policyFile: string;
  trustFile: string;
  updatePolicyOnly?: boolean;
}

interface IamConfig {
  users: IamUserDefinition[];
  roles: IamRoleDefinition[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POLICIES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'iam-policies');

function loadPolicy(filename: string): string {
  return readFileSync(join(POLICIES_DIR, filename), 'utf-8');
}

async function ensureOIDCProvider(client: IAMClient): Promise<void> {
  console.log(`\n--- OIDC Provider: ${GITHUB_OIDC_URL} ---`);

  const { OpenIDConnectProviderList } = await client.send(
    new ListOpenIDConnectProvidersCommand({}),
  );

  const providerArn = `arn:aws:iam::864899858036:oidc-provider/${GITHUB_OIDC_URL}`;
  const exists = OpenIDConnectProviderList?.some((p) => p.Arn === providerArn);

  if (exists) {
    console.log('  Already exists — skipped.');
    return;
  }

  await client.send(
    new CreateOpenIDConnectProviderCommand({
      Url: `https://${GITHUB_OIDC_URL}`,
      ClientIDList: ['sts.amazonaws.com'],
      ThumbprintList: [GITHUB_OIDC_THUMBPRINT],
    }),
  );
  console.log('  Created.');
}

async function ensureIAMUser(client: IAMClient, name: string): Promise<void> {
  try {
    await client.send(new GetUserCommand({ UserName: name }));
    console.log('  User already exists — skipped creation.');
  } catch (err: unknown) {
    if (!isNoSuchEntity(err)) throw err;

    await client.send(new CreateUserCommand({ UserName: name }));
    console.log('  User created.');
  }
}

async function putUserInlinePolicy(
  client: IAMClient,
  userName: string,
  policyName: string,
  policyDocument: string,
): Promise<void> {
  await client.send(
    new PutUserPolicyCommand({ UserName: userName, PolicyName: policyName, PolicyDocument: policyDocument }),
  );
  console.log(`  Inline policy "${policyName}" applied.`);
}

async function ensureAccessKey(client: IAMClient, userName: string): Promise<void> {
  const { AccessKeyMetadata } = await client.send(
    new ListAccessKeysCommand({ UserName: userName }),
  );

  for (const key of AccessKeyMetadata ?? []) {
    await client.send(new DeleteAccessKeyCommand({ UserName: userName, AccessKeyId: key.AccessKeyId }));
    console.log(`  Deleted existing access key (KeyId: ${key.AccessKeyId}).`);
  }

  const { AccessKey } = await client.send(new CreateAccessKeyCommand({ UserName: userName }));

  if (!AccessKey) throw new Error('CreateAccessKey returned no key data.');

  console.log('  Access key created — copy these credentials now, the secret will not be shown again:');
  console.log(`    AWS_ACCESS_KEY_ID:     ${AccessKey.AccessKeyId}`);
  console.log(`    AWS_SECRET_ACCESS_KEY: ${AccessKey.SecretAccessKey}`);
}

async function ensureIAMRole(
  client: IAMClient,
  name: string,
  assumeRolePolicyDocument: string,
): Promise<void> {
  try {
    await client.send(new GetRoleCommand({ RoleName: name }));
    console.log('  Role already exists — skipped creation.');
  } catch (err: unknown) {
    if (!isNoSuchEntity(err)) throw err;

    await client.send(
      new CreateRoleCommand({
        RoleName: name,
        AssumeRolePolicyDocument: assumeRolePolicyDocument,
      }),
    );
    console.log('  Role created.');
  }
}

async function updateRolePolicyIfExists(
  client: IAMClient,
  roleName: string,
  policyName: string,
  policyDocument: string,
): Promise<void> {
  try {
    await client.send(new GetRoleCommand({ RoleName: roleName }));
  } catch (err: unknown) {
    if (!isNoSuchEntity(err)) throw err;
    console.log('  Role does not exist — skipped.');
    return;
  }
  await putRoleInlinePolicy(client, roleName, policyName, policyDocument);
}

async function putRoleInlinePolicy(
  client: IAMClient,
  roleName: string,
  policyName: string,
  policyDocument: string,
): Promise<void> {
  await client.send(
    new PutRolePolicyCommand({ RoleName: roleName, PolicyName: policyName, PolicyDocument: policyDocument }),
  );
  console.log(`  Inline policy "${policyName}" applied.`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Setting up account-level IAM resources for Breadly.');
  console.log(`Region: ${AWS_REGION}`);
  console.log('AWS credentials are taken from the default credential chain');
  console.log('(~/.aws/credentials, AWS_PROFILE, or environment variables).\n');

  const client = new IAMClient({ region: AWS_REGION });

  // 1. Ensure the GitHub Actions OIDC provider exists.
  console.log('== OIDC Provider ==');
  await ensureOIDCProvider(client);

  // 2. IAM Users.
  console.log('\n== IAM Users ==');
  for (const user of IAM_CONFIG.users) {
    console.log(`\n--- User: ${user.name} ---`);
    await ensureIAMUser(client, user.name);
    await putUserInlinePolicy(client, user.name, user.policyName, loadPolicy(user.policyFile));
    await ensureAccessKey(client, user.name);
  }

  // 3. IAM Roles.
  console.log('\n== IAM Roles ==');
  for (const role of IAM_CONFIG.roles) {
    console.log(`\n--- Role: ${role.name} ---`);
    if (role.updatePolicyOnly) {
      await updateRolePolicyIfExists(client, role.name, role.policyName, loadPolicy(role.policyFile));
    } else {
      await ensureIAMRole(client, role.name, loadPolicy(role.trustFile));
      await putRoleInlinePolicy(client, role.name, role.policyName, loadPolicy(role.policyFile));
    }
  }

  console.log('\nAll done.');
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function isNoSuchEntity(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'NoSuchEntityException'
  );
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
