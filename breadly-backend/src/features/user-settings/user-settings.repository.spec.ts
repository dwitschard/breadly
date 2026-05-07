import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { getSettings, upsertSettings } from './user-settings.repository.js';
import { setDynamoClient } from '../../database/dynamodb.client.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('UserSettingsRepository', () => {
  beforeEach(() => {
    ddbMock.reset();
    setDynamoClient(ddbMock as unknown as DynamoDBDocumentClient);
  });

  describe('getSettings', () => {
    it('creates and returns defaults when no record exists', async () => {
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      ddbMock.on(PutCommand).resolves({});

      const result = await getSettings('user-123');

      expect(result).toEqual({ language: 'de', theme: 'light' });
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
    });

    it('returns stored settings when record exists', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'en', theme: 'dark' },
      });

      const result = await getSettings('user-123');

      expect(result).toEqual({ language: 'en', theme: 'dark' });
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
    });
  });

  describe('upsertSettings', () => {
    it('merges patch with existing values', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'de', theme: 'light' },
      });
      ddbMock.on(PutCommand).resolves({});

      const result = await upsertSettings('user-123', { theme: 'dark' });

      expect(result).toEqual({ language: 'de', theme: 'dark' });
      const putCall = ddbMock.commandCalls(PutCommand)[0];
      expect(putCall.args[0].input.Item).toMatchObject({
        PK: 'USER#user-123',
        SK: 'SETTINGS',
        language: 'de',
        theme: 'dark',
      });
    });

    it('uses defaults when no record exists', async () => {
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      ddbMock.on(PutCommand).resolves({});

      const result = await upsertSettings('user-456', { language: 'en' });

      expect(result).toEqual({ language: 'en', theme: 'light' });
    });
  });
});
