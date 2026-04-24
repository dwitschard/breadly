import { toProfile, fetchUserInfo } from './profile.service.js';
import { CognitoClaims } from '../../middleware/auth.middleware.js';

describe('profile.service', () => {
  describe('toProfile', () => {
    const minimalClaims: CognitoClaims = {
      sub: 'user-abc',
      email: 'bob@example.com',
      email_verified: true,
      name: 'Bob',
      'cognito:groups': ['admin'],
    };

    it('maps required fields from Cognito claims when no userInfo provided', () => {
      const profile = toProfile(minimalClaims);
      expect(profile.sub).toBe('user-abc');
      expect(profile.email).toBe('bob@example.com');
      expect(profile.emailVerified).toBe(true);
      expect(profile.roles).toEqual(['admin']);
    });

    it('prefers userInfo email over claims email', () => {
      const userInfo = { sub: 'user-abc', email: 'real@example.com', email_verified: true, name: 'Bob' };
      const claims: CognitoClaims = { sub: 'user-abc', email: 'stale@example.com', name: 'Bob' };
      const profile = toProfile(claims, userInfo);
      expect(profile.email).toBe('real@example.com');
    });

    it('prefers userInfo emailVerified over claims', () => {
      const userInfo = { sub: 'user-abc', email_verified: 'true', name: 'Bob' };
      const claims: CognitoClaims = { sub: 'user-abc', email_verified: false, name: 'Bob' };
      const profile = toProfile(claims, userInfo);
      expect(profile.emailVerified).toBe(true);
    });

    it('handles userInfo email_verified as string "false"', () => {
      const userInfo = { sub: 'user-abc', email_verified: 'false', name: 'Bob' };
      const claims: CognitoClaims = { sub: 'user-abc', email_verified: true, name: 'Bob' };
      const profile = toProfile(claims, userInfo);
      expect(profile.emailVerified).toBe(false);
    });

    it('falls back to claims when userInfo is null', () => {
      const profile = toProfile(minimalClaims, null);
      expect(profile.email).toBe('bob@example.com');
      expect(profile.emailVerified).toBe(true);
    });

    it('defaults emailVerified to false when absent from both', () => {
      const claims: CognitoClaims = { sub: 'u1', name: 'U1' };
      const profile = toProfile(claims);
      expect(profile.emailVerified).toBe(false);
    });

    it('defaults roles to empty array when cognito:groups is absent', () => {
      const claims: CognitoClaims = { sub: 'u1', email: 'a@b.com', email_verified: true, name: 'U1' };
      const profile = toProfile(claims);
      expect(profile.roles).toEqual([]);
    });

    it('prefers userInfo optional fields over claims', () => {
      const claims: CognitoClaims = { ...minimalClaims, name: 'Stale Name' };
      const userInfo = { sub: 'user-abc', name: 'Fresh Name', given_name: 'Fresh' };
      const profile = toProfile(claims, userInfo);
      expect(profile.name).toBe('Fresh Name');
      expect(profile.givenName).toBe('Fresh');
    });

    it('falls back to claims optional fields when userInfo lacks them', () => {
      const claims: CognitoClaims = {
        ...minimalClaims,
        name: 'Bob Builder',
        given_name: 'Bob',
        family_name: 'Builder',
        picture: 'https://example.com/pic.jpg',
      };
      const userInfo = { sub: 'user-abc', name: 'Bob Builder' };
      const profile = toProfile(claims, userInfo);
      expect(profile.name).toBe('Bob Builder');
      expect(profile.givenName).toBe('Bob');
      expect(profile.familyName).toBe('Builder');
      expect(profile.picture).toBe('https://example.com/pic.jpg');
    });

    it('sets name from claims when absent from userInfo', () => {
      const profile = toProfile(minimalClaims);
      expect(profile.name).toBe('Bob');
      expect(profile.givenName).toBeUndefined();
      expect(profile.familyName).toBeUndefined();
      expect(profile.picture).toBeUndefined();
    });

    it('defaults email to empty string when absent from both', () => {
      const claims: CognitoClaims = { sub: 'u1', name: 'U1' };
      const profile = toProfile(claims, null);
      expect(profile.email).toBe('');
    });
  });

  describe('fetchUserInfo', () => {
    const originalCognitoUserInfoUrl = process.env['COGNITO_USERINFO_URL'];

    afterEach(() => {
      if (originalCognitoUserInfoUrl !== undefined) {
        process.env['COGNITO_USERINFO_URL'] = originalCognitoUserInfoUrl;
      } else {
        delete process.env['COGNITO_USERINFO_URL'];
      }
      jest.restoreAllMocks();
    });

    it('returns null when COGNITO_USERINFO_URL is not set', async () => {
      delete process.env['COGNITO_USERINFO_URL'];
      const result = await fetchUserInfo('some-token');
      expect(result).toBeNull();
    });

    it('returns user info on successful response', async () => {
      process.env['COGNITO_USERINFO_URL'] = 'https://auth.example.com/oauth2/userInfo';
      const mockResponse = { sub: 'u1', email: 'test@example.com', email_verified: 'true' };
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchUserInfo('valid-token');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.example.com/oauth2/userInfo',
        { headers: { Authorization: 'Bearer valid-token' } },
      );
    });

    it('returns null on non-ok response', async () => {
      process.env['COGNITO_USERINFO_URL'] = 'https://auth.example.com/oauth2/userInfo';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const result = await fetchUserInfo('expired-token');
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      process.env['COGNITO_USERINFO_URL'] = 'https://auth.example.com/oauth2/userInfo';
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await fetchUserInfo('some-token');
      expect(result).toBeNull();
    });
  });
});
