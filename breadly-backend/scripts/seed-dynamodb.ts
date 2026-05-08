/**
 * seed-dynamodb.ts — Seeds DynamoDB with test data for non-production environments.
 *
 * Reads breadly-backend/seed-data/dynamodb.json, resolves each user's Cognito sub
 * from their email address, then writes the seed records to DynamoDB.
 * All existing records are overwritten (idempotent reset to a known baseline).
 *
 * Usage:
 *   DYNAMODB_TABLE_NAME=breadly-dev \
 *   COGNITO_USER_POOL_ID=eu-central-1_xxx \
 *   npx tsx scripts/seed-dynamodb.ts
 *
 * Environment variables:
 *   DYNAMODB_TABLE_NAME      — target DynamoDB table (required)
 *   COGNITO_USER_POOL_ID     — Cognito User Pool ID to resolve emails to subs (required)
 *   AWS_REGION               — AWS region (default: eu-central-1)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const region = process.env['AWS_REGION'] ?? 'eu-central-1';
const tableName = process.env['DYNAMODB_TABLE_NAME'];
const userPoolId = process.env['COGNITO_USER_POOL_ID'];

if (!tableName) {
  console.error('Error: DYNAMODB_TABLE_NAME is required');
  process.exit(1);
}
if (!userPoolId) {
  console.error('Error: COGNITO_USER_POOL_ID is required');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Seed data types
// ---------------------------------------------------------------------------

interface ReminderSeed {
  scheduleId: string;
  recipeId: string;
  scheduledAt: string;
  title: string;
  message: string;
  status: 'active' | 'disabled';
}

interface UserSeed {
  email: string;
  reminders: ReminderSeed[];
}

interface SeedFile {
  users: UserSeed[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
  marshallOptions: { removeUndefinedValues: true },
});

async function resolveUserSub(email: string): Promise<string> {
  const response = await cognitoClient.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }),
  );
  const sub = response.UserAttributes?.find((a) => a.Name === 'sub')?.Value;
  if (!sub) throw new Error(`No sub found for user ${email}`);
  return sub;
}

async function seedReminder(pk: string, reminder: ReminderSeed): Promise<void> {
  const sk = `REMINDER#${reminder.scheduleId}`;
  const ttlDays = 10;
  // TTL is relative to now so the record survives the full retention window
  // regardless of how far in the past scheduledAt is.
  const ttl =
    reminder.status === 'disabled'
      ? Math.floor(Date.now() / 1000) + ttlDays * 86400
      : undefined;

  await dynamoClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: pk,
        SK: sk,
        scheduleId: reminder.scheduleId,
        recipeId: reminder.recipeId,
        scheduledAt: reminder.scheduledAt,
        title: reminder.title,
        message: reminder.message,
        status: reminder.status,
        ...(ttl !== undefined ? { ttl } : {}),
      },
    }),
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dir = dirname(fileURLToPath(import.meta.url));
  const seedPath = resolve(dir, '..', 'seed-data', 'dynamodb.json');
  const seedData: SeedFile = JSON.parse(readFileSync(seedPath, 'utf-8'));

  console.log(`Seeding DynamoDB table: ${tableName}`);
  console.log(`Cognito User Pool: ${userPoolId}`);
  console.log(`Region: ${region}\n`);

  for (const user of seedData.users) {
    console.log(`User: ${user.email}`);

    let sub: string;
    try {
      sub = await resolveUserSub(user.email);
      console.log(`  sub: ${sub}`);
    } catch (err) {
      console.warn(`  Skipped — user not found in Cognito: ${(err as Error).message}`);
      continue;
    }

    const pk = `USER#${sub}`;

    if (user.reminders.length === 0) {
      console.log('  No reminders to seed.');
      continue;
    }

    for (const reminder of user.reminders) {
      await seedReminder(pk, reminder);
      console.log(`  Seeded reminder: ${reminder.scheduleId}`);
    }
  }

  console.log('\nDone.');
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
