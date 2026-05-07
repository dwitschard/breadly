import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient, tableName } from '../../database/dynamodb.client.js';
import { UserSettingsDto } from '../../app/generated/api/index.js';

const SETTINGS_SK = 'SETTINGS';
const DEFAULT_SETTINGS: UserSettingsDto = { language: 'de', theme: 'light' };

const pk = (userId: string): string => `USER#${userId}`;

export const getSettings = async (userId: string): Promise<UserSettingsDto> => {
  const client = getDynamoClient();
  const result = await client.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: pk(userId), SK: SETTINGS_SK },
    }),
  );

  if (!result.Item) {
    await upsertSettings(userId, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }

  return {
    language: result.Item['language'] as UserSettingsDto['language'],
    theme: result.Item['theme'] as UserSettingsDto['theme'],
  };
};

export const upsertSettings = async (
  userId: string,
  patch: Partial<UserSettingsDto>,
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

  await client.send(
    new PutCommand({
      TableName: tableName(),
      Item: { PK: pk(userId), SK: SETTINGS_SK, ...updated },
    }),
  );

  return updated;
};
