import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient, tableName } from '../../database/dynamodb.client.js';
import { UserSettingsDto } from '../../app/generated/api/index.js';

const SETTINGS_SK = 'SETTINGS';
const DEFAULT_SETTINGS: UserSettingsDto = { language: 'de', theme: 'light' };

const pk = (userId: string): string => `USER#${userId}`;

export const getSettings = async (userId: string, email?: string): Promise<UserSettingsDto> => {
  const client = getDynamoClient();
  const result = await client.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: pk(userId), SK: SETTINGS_SK },
    }),
  );

  const lastLogin = new Date().toISOString();

  if (!result.Item) {
    await upsertSettings(userId, DEFAULT_SETTINGS, email, lastLogin);
    return { ...DEFAULT_SETTINGS, lastLogin };
  }

  const storedEmail = result.Item['email'] as string | undefined;
  const effectiveEmail = email ?? storedEmail;

  const updatedItem: Record<string, unknown> = { ...result.Item, lastLogin };
  if (effectiveEmail !== undefined) updatedItem['email'] = effectiveEmail;

  await client.send(
    new PutCommand({
      TableName: tableName(),
      Item: updatedItem,
    }),
  );

  return {
    language: result.Item['language'] as UserSettingsDto['language'],
    theme: result.Item['theme'] as UserSettingsDto['theme'],
    lastLogin,
  };
};

export const upsertSettings = async (
  userId: string,
  patch: Partial<UserSettingsDto>,
  email?: string,
  lastLogin?: string,
): Promise<UserSettingsDto> => {
  const client = getDynamoClient();

  const existing = await client.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: pk(userId), SK: SETTINGS_SK },
    }),
  );

  const current: UserSettingsDto = existing.Item
    ? {
        language: existing.Item['language'] as UserSettingsDto['language'],
        theme: existing.Item['theme'] as UserSettingsDto['theme'],
      }
    : { ...DEFAULT_SETTINGS };

  const updated: UserSettingsDto = {
    language: patch.language ?? current.language,
    theme: patch.theme ?? current.theme,
  };

  const effectiveEmail = email ?? (existing.Item?.['email'] as string | undefined);
  const effectiveLastLogin = lastLogin ?? (existing.Item?.['lastLogin'] as string | undefined);

  const item: Record<string, unknown> = { PK: pk(userId), SK: SETTINGS_SK, ...updated };
  if (effectiveEmail) item['email'] = effectiveEmail;
  if (effectiveLastLogin) item['lastLogin'] = effectiveLastLogin;

  await client.send(
    new PutCommand({
      TableName: tableName(),
      Item: item,
    }),
  );

  if (effectiveLastLogin) updated.lastLogin = effectiveLastLogin;
  return updated;
};
