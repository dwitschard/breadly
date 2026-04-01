import {Request, Response, Router} from 'express';
import {toProfile} from './profile.service.js';

const profileController = Router();

profileController.get('/', (req: Request, res: Response) => {
  res.json(toProfile(req.user!));
});

export { profileController };
