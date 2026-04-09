import { Profile } from '../../generated/api';

export function profileDisplayName(profile: Profile | null): string {
  if (!profile) return '';
  return profile.name ?? profile.givenName ?? profile.email;
}
