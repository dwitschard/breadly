import { Request, Response, Router } from 'express';
import { fetchUserInfo, toProfile, getUserSettings, updateUserSettings } from './profile.service.js';
import { PatchUserSettingsDto } from '../../app/generated/api/index.js';
import { validate } from '../../common/validation.middleware.js';
import { PatchUserSettingsDtoSchema } from '../../common/validation-schemas.js';

const profileController = Router();

profileController.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const userInfo = await fetchUserInfo(req.accessToken!);
  const settings = await getUserSettings(userId, userInfo?.email);
  res.json(toProfile(req.user!, userInfo, settings));
});

profileController.get('/settings', async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const userInfo = await fetchUserInfo(req.accessToken!);
  const settings = await getUserSettings(userId, userInfo?.email);
  res.json(settings);
});

profileController.patch(
  '/settings',
  validate(PatchUserSettingsDtoSchema),
  async (req: Request<Record<string, never>, unknown, PatchUserSettingsDto>, res: Response) => {
    const userId = req.user!.sub;
    const updated = await updateUserSettings(userId, req.body);
    res.json(updated);
  },
);

export { profileController };
