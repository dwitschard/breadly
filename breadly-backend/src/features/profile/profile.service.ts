import { CognitoClaims } from '../../middleware/auth.middleware.js';
import { Profile } from '../../app/generated/api/index.js';
import { logger } from '../../common/logger.js';
import { env } from '../../config/env.js';

interface UserInfoResponse {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export const fetchUserInfo = async (accessToken: string): Promise<UserInfoResponse | null> => {
  const userInfoUrl = env.COGNITO_USERINFO_URL;
  if (!userInfoUrl) {
    logger.warn('COGNITO_USERINFO_URL not configured, skipping UserInfo fetch');
    return null;
  }

  try {
    const response = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Cognito UserInfo request failed');
      return null;
    }

    return (await response.json()) as UserInfoResponse;
  } catch (error) {
    logger.warn({ error }, 'Cognito UserInfo request error');
    return null;
  }
};

export const toProfile = (claims: CognitoClaims, userInfo?: UserInfoResponse | null): Profile => {
  const email = userInfo?.email ?? claims.email ?? '';
  const emailVerified = userInfo?.email_verified !== undefined
    ? String(userInfo.email_verified) === 'true'
    : (claims.email_verified ?? false);

  const name = userInfo?.name ?? claims.name;
  const givenName = userInfo?.given_name ?? claims.given_name;
  const familyName = userInfo?.family_name ?? claims.family_name;
  const picture = userInfo?.picture ?? claims.picture;

  const profile: Profile = {
    sub: claims.sub,
    email,
    emailVerified,
    name,
    roles: claims['cognito:groups'] ?? [],
  };

  if (givenName !== undefined) profile.givenName = givenName;
  if (familyName !== undefined) profile.familyName = familyName;
  if (picture !== undefined) profile.picture = picture;

  return profile;
};
