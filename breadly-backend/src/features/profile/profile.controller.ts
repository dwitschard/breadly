import { Request, Response, Router } from 'express';
import { fetchUserInfo, toProfile } from './profile.service.js';

const profileController = Router();

profileController.get('/', async (req: Request, res: Response) => {
  const userInfo = await fetchUserInfo(req.accessToken!);
  res.json(toProfile(req.user!, userInfo));
});

export { profileController };
