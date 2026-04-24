import { Profile } from '../../generated/api';
import { profileDisplayName } from './profile-display-name';

describe('profileDisplayName', () => {
  it('returns empty string for null', () => {
    expect(profileDisplayName(null)).toBe('');
  });

  it('returns name when available', () => {
    const profile: Profile = {
      sub: '1',
      email: 'a@b.com',
      emailVerified: true,
      name: 'Alice Smith',
      givenName: 'Alice',
      roles: [],
    };
    expect(profileDisplayName(profile)).toBe('Alice Smith');
  });

  it('falls back to givenName when name is undefined', () => {
    const profile = {
      sub: '1',
      email: 'a@b.com',
      emailVerified: true,
      givenName: 'Alice',
      roles: [],
    } as unknown as Profile;
    expect(profileDisplayName(profile)).toBe('Alice');
  });

  it('falls back to email when both name and givenName are undefined', () => {
    const profile = {
      sub: '1',
      email: 'a@b.com',
      emailVerified: true,
      roles: [],
    } as unknown as Profile;
    expect(profileDisplayName(profile)).toBe('a@b.com');
  });

  it('returns name even when it is an empty string', () => {
    const profile: Profile = {
      sub: '1',
      email: 'a@b.com',
      emailVerified: true,
      name: '',
      givenName: 'Alice',
      roles: [],
    };
    expect(profileDisplayName(profile)).toBe('');
  });
});
