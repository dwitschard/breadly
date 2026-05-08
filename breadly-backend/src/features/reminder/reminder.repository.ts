import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient, tableName } from '../../database/dynamodb.client.js';
import { Reminder } from '../../app/generated/api/index.js';

const TTL_DAYS = 10;

const pk = (userId: string): string => `USER#${userId}`;
const sk = (scheduleId: string): string => `REMINDER#${scheduleId}`;

const toReminder = (item: Record<string, unknown>): Reminder => ({
  id: item['scheduleId'] as string,
  recipeId: item['recipeId'] as string,
  scheduledAt: item['scheduledAt'] as string,
  title: item['title'] as string | undefined,
  message: item['message'] as string | undefined,
  status: item['status'] as Reminder['status'],
});

export const createRecord = async (reminder: {
  userId: string;
  scheduleId: string;
  recipeId: string;
  scheduledAt: string;
  title: string;
  message: string;
}): Promise<void> => {
  const client = getDynamoClient();
  await client.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        PK: pk(reminder.userId),
        SK: sk(reminder.scheduleId),
        scheduleId: reminder.scheduleId,
        recipeId: reminder.recipeId,
        scheduledAt: reminder.scheduledAt,
        title: reminder.title,
        message: reminder.message,
        status: 'active',
      },
    }),
  );
};

export const updateStatus = async (
  userId: string,
  scheduleId: string,
  status: 'active' | 'disabled',
): Promise<void> => {
  const client = getDynamoClient();
  const now = Math.floor(Date.now() / 1000);
  const ttl = status === 'disabled' ? now + TTL_DAYS * 86400 : undefined;

  await client.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { PK: pk(userId), SK: sk(scheduleId) },
      UpdateExpression: ttl !== undefined
        ? 'SET #s = :s, #ttl = :ttl'
        : 'SET #s = :s',
      ExpressionAttributeNames: {
        '#s': 'status',
        ...(ttl !== undefined ? { '#ttl': 'ttl' } : {}),
      },
      ExpressionAttributeValues: {
        ':s': status,
        ...(ttl !== undefined ? { ':ttl': ttl } : {}),
      },
    }),
  );
};

export const deleteRecord = async (userId: string, scheduleId: string): Promise<void> => {
  const client = getDynamoClient();
  await client.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: { PK: pk(userId), SK: sk(scheduleId) },
    }),
  );
};

export const listByUser = async (userId: string): Promise<Reminder[]> => {
  const client = getDynamoClient();
  const result = await client.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': pk(userId),
        ':prefix': 'REMINDER#',
      },
    }),
  );

  return (result.Items ?? []).map((item) => toReminder(item as Record<string, unknown>));
};

export const getRecord = async (userId: string, scheduleId: string): Promise<Reminder | null> => {
  const client = getDynamoClient();
  const result = await client.send(
    new GetCommand({
      TableName: tableName(),
      Key: { PK: pk(userId), SK: sk(scheduleId) },
    }),
  );

  if (!result.Item) return null;
  return toReminder(result.Item as Record<string, unknown>);
};
