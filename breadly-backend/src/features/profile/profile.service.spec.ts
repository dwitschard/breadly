import { toProfile } from './profile.service.js';
import { CognitoClaims } from '../../middleware/auth.middleware.js';

describe('profile.service', () => {
  const minimalClaims: CognitoClaims = {
    sub: 'user-abc',
    email: 'bob@example.com',
    email_verified: true,
    'cognito:groups': ['admin'],
  };

  it('maps required fields from Cognito claims', () => {
    const profile = toProfile(minimalClaims);
    expect(profile.sub).toBe('user-abc');
    expect(profile.email).toBe('bob@example.com');
    expect(profile.emailVerified).toBe(true);
    expect(profile.roles).toEqual(['admin']);
  });

  it('defaults emailVerified to false when absent', () => {
    const claims: CognitoClaims = { sub: 'u1', email: 'a@b.com' };
    const profile = toProfile(claims);
    expect(profile.emailVerified).toBe(false);
  });

  it('defaults roles to empty array when cognito:groups is absent', () => {
    const claims: CognitoClaims = { sub: 'u1', email: 'a@b.com', email_verified: true };
    const profile = toProfile(claims);
    expect(profile.roles).toEqual([]);
  });

  it('includes optional fields when present', () => {
    const claims: CognitoClaims = {
      ...minimalClaims,
      name: 'Bob Builder',
      given_name: 'Bob',
      family_name: 'Builder',
      picture: 'https://example.com/pic.jpg',
    };
    const profile = toProfile(claims);
    expect(profile.name).toBe('Bob Builder');
    expect(profile.givenName).toBe('Bob');
    expect(profile.familyName).toBe('Builder');
    expect(profile.picture).toBe('https://example.com/pic.jpg');
  });

  it('omits optional fields when absent', () => {
    const profile = toProfile(minimalClaims);
    expect(profile.name).toBeUndefined();
    expect(profile.givenName).toBeUndefined();
    expect(profile.familyName).toBeUndefined();
    expect(profile.picture).toBeUndefined();
  });

  it('defaults email to empty string when absent', () => {
    const claims: CognitoClaims = { sub: 'u1' };
    const profile = toProfile(claims);
    expect(profile.email).toBe('');
  });
});
