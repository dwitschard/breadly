import { Request, Response, Router } from 'express';
import {
  getAllTechnologies,
  getTechnologyById,
  postTechnology,
} from './technology.service';
import { Technology } from './technology.types';

const technologyController = Router();

technologyController.get('/', async (_: Request, res: Response) =>
  res.status(200).json(await getAllTechnologies()),
);

technologyController.post(
  '/',
  async (req: Request<Record<string, never>, unknown, Technology>, res: Response) => {
    const persisted = await postTechnology(req.body);
    res.status(200).json(persisted);
  },
);

technologyController.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const result = await getTechnologyById(req.params.id);

  if (result) {
    res.send(result);
  } else {
    res.status(404).end();
  }
});

export { technologyController };
