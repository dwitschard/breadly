import { CognitoClaims } from '../../middleware/auth.middleware.js';
import { Profile } from '../../app/generated/api/index.js';

export const toProfile = (claims: CognitoClaims): Profile => {
  const profile: Profile = {
    sub: claims.sub,
    email: claims.email ?? '',
    emailVerified: claims.email_verified ?? false,
    roles: claims['cognito:groups'] ?? [],
  };

  if (claims.name !== undefined) profile.name = claims.name;
  if (claims.given_name !== undefined) profile.givenName = claims.given_name;
  if (claims.family_name !== undefined) profile.familyName = claims.family_name;
  if (claims.picture !== undefined) profile.picture = claims.picture;

  return profile;
};
