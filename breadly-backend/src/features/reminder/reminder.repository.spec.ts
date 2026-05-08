import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { listByUser, updateStatus } from './reminder.repository.js';
import { setDynamoClient } from '../../database/dynamodb.client.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('ReminderRepository', () => {
  beforeEach(() => {
    ddbMock.reset();
    setDynamoClient(ddbMock as unknown as DynamoDBDocumentClient);
  });

  describe('listByUser', () => {
    it('queries by partition key and returns mapped reminders', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            scheduleId: 'local-reminder-user1-abc',
            recipeId: 'recipe-1',
            scheduledAt: '2027-01-01T09:00:00.000Z',
            title: 'Test',
            message: 'Msg',
            status: 'active',
          },
        ],
      });

      const result = await listByUser('user1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'local-reminder-user1-abc', status: 'active' });

      const queryCall = ddbMock.commandCalls(QueryCommand)[0];
      expect(queryCall.args[0].input.ExpressionAttributeValues).toMatchObject({
        ':pk': 'USER#user1',
        ':prefix': 'REMINDER#',
      });
    });

    it('returns empty array when no items found', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      const result = await listByUser('user2');
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('sets status to disabled and includes ttl approximately 10 days from now', async () => {
      ddbMock.on(UpdateCommand).resolves({});
      const before = Math.floor(Date.now() / 1000);

      await updateStatus('user1', 'schedule-abc', 'disabled');

      const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
      const values = updateCall.args[0].input.ExpressionAttributeValues!;
      const ttl = values[':ttl'] as number;

      expect(values[':s']).toBe('disabled');
      const tenDaysInSeconds = 10 * 86400;
      expect(ttl).toBeGreaterThanOrEqual(before + tenDaysInSeconds - 5);
      expect(ttl).toBeLessThanOrEqual(before + tenDaysInSeconds + 5);
    });

    it('does not set ttl when updating to active', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      await updateStatus('user1', 'schedule-abc', 'active');

      const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
      const values = updateCall.args[0].input.ExpressionAttributeValues!;
      expect(values[':ttl']).toBeUndefined();
    });
  });
});
