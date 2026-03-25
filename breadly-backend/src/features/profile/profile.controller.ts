import {Request, Response, Router} from 'express';

const profileController = Router();

profileController.get('/', (req: Request, res: Response) => {
  const claims = req.user!;

  const profile: Record<string, unknown> = {
    sub: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified ?? false,
    roles: claims['cognito:groups'] ?? [],
  };

  if (claims.name !== undefined) profile['name'] = claims.name;
  if (claims.given_name !== undefined) profile['givenName'] = claims.given_name;
  if (claims.family_name !== undefined) profile['familyName'] = claims.family_name;
  if (claims.picture !== undefined) profile['picture'] = claims.picture;

  res.json(profile);
});

export { profileController };
