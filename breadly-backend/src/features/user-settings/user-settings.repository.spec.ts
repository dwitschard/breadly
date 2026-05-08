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

      expect(result).toMatchObject({ language: 'de', theme: 'light' });
      expect(result.lastLogin).toBeDefined();
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
    });

    it('returns stored settings when record exists', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'en', theme: 'dark' },
      });
      ddbMock.on(PutCommand).resolves({});

      const result = await getSettings('user-123');

      expect(result).toMatchObject({ language: 'en', theme: 'dark' });
    });

    it('always updates lastLogin for existing records', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'en', theme: 'dark' },
      });
      ddbMock.on(PutCommand).resolves({});

      const result = await getSettings('user-123');

      expect(result.lastLogin).toBeDefined();
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(PutCommand)[0].args[0].input.Item?.['lastLogin']).toBeDefined();
    });

    it('updates email when stored email differs from provided email', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'en', theme: 'dark', email: 'old@example.com' },
      });
      ddbMock.on(PutCommand).resolves({});

      await getSettings('user-123', 'new@example.com');

      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(PutCommand)[0].args[0].input.Item).toMatchObject({
        email: 'new@example.com',
      });
    });

    it('preserves existing email when same email is provided', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'en', theme: 'dark', email: 'same@example.com' },
      });
      ddbMock.on(PutCommand).resolves({});

      await getSettings('user-123', 'same@example.com');

      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(PutCommand)[0].args[0].input.Item).toMatchObject({
        email: 'same@example.com',
      });
    });
  });

  describe('upsertSettings', () => {
    it('merges patch with existing values', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'de', theme: 'light' },
      });
      ddbMock.on(PutCommand).resolves({});

      const result = await upsertSettings('user-123', { theme: 'dark' });

      expect(result).toMatchObject({ language: 'de', theme: 'dark' });
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

      expect(result).toMatchObject({ language: 'en', theme: 'light' });
    });

    it('preserves lastLogin from existing record when patching settings', async () => {
      const existingLastLogin = '2026-01-01T10:00:00.000Z';
      ddbMock.on(GetCommand).resolves({
        Item: { PK: 'USER#user-123', SK: 'SETTINGS', language: 'de', theme: 'light', lastLogin: existingLastLogin },
      });
      ddbMock.on(PutCommand).resolves({});

      const result = await upsertSettings('user-123', { theme: 'dark' });

      expect(result.lastLogin).toBe(existingLastLogin);
      expect(ddbMock.commandCalls(PutCommand)[0].args[0].input.Item?.['lastLogin']).toBe(existingLastLogin);
    });
  });
});
