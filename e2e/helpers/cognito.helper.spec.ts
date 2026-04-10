import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  authenticateWithCognito,
  buildStorageState,
  writeStorageState,
  warmUpHealthCheck,
} from './cognito.helper';

vi.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const sendMock = vi.fn();
  return {
    CognitoIdentityProviderClient: vi.fn(() => ({ send: sendMock })),
    InitiateAuthCommand: vi.fn(),
    __sendMock: sendMock,
  };
});

describe('cognito.helper', () => {
  describe('authenticateWithCognito', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns tokens on successful authentication', async () => {
      const { __sendMock: sendMock } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      ) as any;
      sendMock.mockResolvedValue({
        AuthenticationResult: {
          IdToken: 'mock-id-token',
          AccessToken: 'mock-access-token',
          ExpiresIn: 3600,
        },
      });

      const tokens = await authenticateWithCognito({
        region: 'eu-central-1',
        userPoolClientId: 'test-client-id',
        username: 'demo@breadly.app',
        password: 'test-password',
      });

      expect(tokens.idToken).toBe('mock-id-token');
      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.expiresIn).toBe(3600);
    });

    it('throws when no tokens are returned', async () => {
      const { __sendMock: sendMock } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      ) as any;
      sendMock.mockResolvedValue({
        AuthenticationResult: {},
      });

      await expect(
        authenticateWithCognito({
          region: 'eu-central-1',
          userPoolClientId: 'test-client-id',
          username: 'demo@breadly.app',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Cognito authentication failed');
    });

    it('defaults expiresIn to 3600 when not provided', async () => {
      const { __sendMock: sendMock } = await import(
        '@aws-sdk/client-cognito-identity-provider'
      ) as any;
      sendMock.mockResolvedValue({
        AuthenticationResult: {
          IdToken: 'mock-id-token',
          AccessToken: 'mock-access-token',
        },
      });

      const tokens = await authenticateWithCognito({
        region: 'eu-central-1',
        userPoolClientId: 'test-client-id',
        username: 'demo@breadly.app',
        password: 'test-password',
      });

      expect(tokens.expiresIn).toBe(3600);
    });
  });

  describe('buildStorageState', () => {
    it('creates storage state with correct localStorage keys', () => {
      const tokens = {
        idToken: 'id-tok',
        accessToken: 'access-tok',
        expiresIn: 3600,
      };

      const state = buildStorageState(tokens, 'https://preview.breadly.app');

      expect(state.cookies).toEqual([]);
      expect(state.origins).toHaveLength(1);
      expect(state.origins[0].origin).toBe('https://preview.breadly.app');

      const localStorageMap = new Map(
        state.origins[0].localStorage.map((e) => [e.name, e.value]),
      );

      expect(localStorageMap.get('access_token')).toBe('access-tok');
      expect(localStorageMap.get('id_token')).toBe('id-tok');
      expect(localStorageMap.has('expires_at')).toBe(true);
      expect(localStorageMap.get('granted_scopes')).toBe('openid email');
      expect(localStorageMap.has('access_token_stored_at')).toBe(true);
      expect(localStorageMap.has('id_token_stored_at')).toBe(true);
      expect(localStorageMap.has('id_token_expires_at')).toBe(true);
    });

    it('handles base URL with path', () => {
      const tokens = {
        idToken: 'id-tok',
        accessToken: 'access-tok',
        expiresIn: 3600,
      };

      const state = buildStorageState(
        tokens,
        'https://preview.breadly.app/preview/my-branch/',
      );

      expect(state.origins[0].origin).toBe('https://preview.breadly.app');
    });
  });

  describe('writeStorageState', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-test-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates directory and writes JSON file', () => {
      const state = { cookies: [] as [], origins: [] };
      const filePath = path.join(tmpDir, 'nested', 'auth', 'user.json');

      writeStorageState(state, filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      const written = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(written).toEqual(state);
    });
  });

  describe('warmUpHealthCheck', () => {
    it('succeeds on first attempt with ok response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);

      await warmUpHealthCheck('http://localhost:4200', 3, 0);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:4200/api/health');

      vi.unstubAllGlobals();
    });

    it('retries on failure and succeeds', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);

      await warmUpHealthCheck('http://localhost:4200', 3, 0);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      vi.unstubAllGlobals();
    });

    it('warns but does not throw after max retries', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubGlobal('fetch', fetchMock);

      await warmUpHealthCheck('http://localhost:4200', 2, 0);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('failed after 2 attempts'),
      );

      warnSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});
